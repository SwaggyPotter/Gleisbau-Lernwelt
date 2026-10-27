import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ServiceWorkerModule } from '@angular/service-worker';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SiteGateComponent } from './core/site-gate/site-gate.component';
import { ChatWidgetComponent } from './core/chat/chat-widget.component';
import { AuthInterceptor } from './core/auth/interceptors/auth.interceptor';

@NgModule({
  declarations: [AppComponent, SiteGateComponent, ChatWidgetComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:5000',
    }),
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent],
})
export class AppModule {}
