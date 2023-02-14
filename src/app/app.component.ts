import {Component} from '@angular/core';
import {IExec} from "iexec";

const VALIDATOR_APP_ADDRESS = '0xFF1204Ce914006C7479b0E362A4AC6917F84D8b3';
const APP_CALL_PARAMETERS = 'setup'
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent{
  title: string = 'hellp';

  initWallet() {
    if (typeof window.ethereum !== 'undefined') {
      console.log('MetaMask is installed!');
    }
  }
}

