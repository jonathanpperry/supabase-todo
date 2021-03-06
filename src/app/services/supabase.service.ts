import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

const TODO_DB = 'todos';

export interface Todo {
  id: number;
  inserted_at: string;
  is_complete: boolean;
  task: string;
  user_id: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  supabase: SupabaseClient;
  private _currentUser: BehaviorSubject<any> = new BehaviorSubject(null);
  private _todos: BehaviorSubject<any> = new BehaviorSubject([]);

  constructor(private router: Router) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        autoRefreshToken: true,
        persistSession: true,
      }
    );

    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        this._currentUser.next(session.user);
        this.loadTodos();
        this.handleTodosChanged();
      } else {
        this._currentUser.next(false);
      }
    });
  }

  loadUser() {}

  async signUp(credentials: { email; password }) {
    return new Promise(async (resolve, reject) => {
      const { error, data } = await this.supabase.auth.signUp(credentials);
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  }

  async signIn(credentials: { email; password }) {
    return new Promise(async (resolve, reject) => {
      const { error, data } = await this.supabase.auth.signIn(credentials);
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  }

  async signOut() {
    await this.supabase.auth.signOut();

    this.supabase.getSubscriptions().map((sub) => {
      this.supabase.removeSubscription(sub);
    });

    this.router.navigateByUrl('/');
  }

  get todos() {
    return this._todos.asObservable();
  }

  get currentUser() {
    return this._currentUser;
  }

  async loadTodos() {
    const query = await this.supabase.from(TODO_DB).select('*');
    console.log('Query: ', query);

    this._todos.next(query.data);
  }

  async addTodo(task: string) {
    const newTodo = {
      user_id: this.supabase.auth.user().id,
      task,
    };
    // Min length of task is 3 chars
    const result = await this.supabase.from(TODO_DB).insert(newTodo);
  }

  async removeTodo(id) {
    await this.supabase.from(TODO_DB).delete().match({ id });
  }

  async updateTodo(id, is_complete: boolean) {
    await this.supabase.from(TODO_DB).update({ is_complete }).match({ id });
  }

  handleTodosChanged() {
    this.supabase
      .from(TODO_DB)
      .on('*', (payload) => {
        console.log('payload: ', payload);
        if (payload.eventType == 'DELETE') {
          const oldItem: Todo = payload.old;
          const newValue = this._todos.value.filter(
            (item) => oldItem.id != item.id
          );
          this._todos.next(newValue);
        } else if (payload.eventType == 'INSERT') {
          const newItem: Todo = payload.new;
          this._todos.next([...this._todos.value, newItem]);
        } else if (payload.eventType == 'UPDATE') {
          const updatedItem: Todo = payload.new;
          const newValue = this._todos.value.map((item) => {
            if (updatedItem.id == item.id) {
              item = updatedItem;
            }
            return item;
          });
          this._todos.next(newValue);
        }
      })
      .subscribe();
  }
}
