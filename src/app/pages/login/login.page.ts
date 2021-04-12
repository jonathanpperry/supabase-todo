import { Component, OnInit } from '@angular/core';
import { SupabaseService } from 'src/app/services/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  constructor(private supabaseService: SupabaseService) { }

  ngOnInit() {
  }

  signUp() {
    this.supabaseService({'', ''}).then(data => {
      if (data.error) {}
    })
  }

}
