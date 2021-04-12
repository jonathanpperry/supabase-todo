import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  supabase: SupabaseClient;
  private _currentUser: BehaviorSubject<any> = new BehaviorSubject(null);

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

  async signIn() {
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
}
