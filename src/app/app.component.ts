import {Component} from '@angular/core';
import {IExec, IExecConfig} from "iexec";


const VALIDATOR_APP_ADDRESS = '0xFF1204Ce914006C7479b0E362A4AC6917F84D8b3';
const APP_CALL_PARAMETERS = 'setup'
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  ethProvider: any;
  iexec: any;

  async initWallet() {
    if (typeof window.ethereum !== 'undefined') {
      console.log('MetaMask is installed!');
    }
    if (window.ethereum) {
      console.log('requesting metamask...')
        console.log("using default provider");
        this.ethProvider = window.ethereum;
      this.ethProvider.on("chainChanged", (_chainId: any) => window.location.reload());
      this.ethProvider.on("accountsChanged", (_accounts: any) =>
          window.location.reload()
        );
        await window.ethereum.request({
          method: "eth_requestAccounts"
        });
        window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x86",
              chainName: "iExec Sidechain",
              nativeCurrency: {
                name: "xRLC",
                symbol: "xRLC",
                decimals: 18
              },
              rpcUrls: ["https://bellecour.iex.ec"],
              blockExplorerUrls: ["https://blockscout-bellecour.iex.ec"]
            }
          ]
        });
      }
  }
  verifyProvider() {
    console.log('ethereum provider: ', this.ethProvider);
  }

  initIexecUsingConfig() {
    this.iexec = new IExecConfig({ethProvider: this.ethProvider});
    console.log('iexec initialized: ', this.iexec)
  }
}

