import {Component} from '@angular/core';
import {
  IExec,
  IExecConfig,
  IExecDealModule,
  IExecOrderbookModule,
  IExecOrderModule,
  IExecTaskModule,
  IExecWalletModule
} from "iexec";


const VALIDATOR_APP_ADDRESS = '0xFF1204Ce914006C7479b0E362A4AC6917F84D8b3';
const APP_CATEGORY = 0;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  lastValidationResult: string = '';
  taskId: string = '';
  ethProvider: any;
  iexec: any;
  TOTPCode: string = '';
  codeSendingStatus: string = 'Not sent';

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
    this.initIexecUsingConfig()
  }

  initIexecUsingConfig() {
    this.iexec = new IExecConfig({ethProvider: this.ethProvider});
    console.log('iexec initialized: ', this.iexec)
  }

  async validateTotpCode() {
    // fetch signed app orders for our deployed TOTP application
    const orderBook = IExecOrderbookModule.fromConfig(this.iexec)
    const appOrders = await orderBook.fetchAppOrderbook(
      VALIDATOR_APP_ADDRESS
    );
    console.log('app orders for totp validator: ', appOrders);

    // get the last order's hash
    let firstAppOrder = appOrders.orders?.[0]
    let firstAppOrderHash: string = firstAppOrder?.orderHash;
    console.log('app order hash to execute: ', firstAppOrderHash);


    // get workerPoolOrders to get the execution price
    const workerPoolOrders = await orderBook.fetchWorkerpoolOrderbook({
      category: APP_CATEGORY,
      workerpool: "v7-prod.main.pools.iexec.eth" // use iExec official workerpool
    });
    const workerPoolOrder = workerPoolOrders.orders?.[0]
    console.log('workerPoolOrder: ', workerPoolOrder);

    // get user address
    let wallet = IExecWalletModule.fromConfig(this.iexec);
    const userAddress = await wallet.getAddress();
    console.log('user address: ', userAddress);

    // create RequestOrder
    let orderModule = IExecOrderModule.fromConfig(this.iexec);
    const requestOrderToSign = await orderModule.createRequestorder({
      app: VALIDATOR_APP_ADDRESS,
      appmaxprice: firstAppOrder?.order.appprice,
      workerpoolmaxprice: workerPoolOrder?.order.workerpoolprice,
      requester: userAddress,
      volume: 1,
      params: `signature ${this.TOTPCode}`,
      category: APP_CATEGORY
    });
    console.log('created requestOrder: ', requestOrderToSign);

    // sign request order using initialized iexec
    const requestOrder = await orderModule.signRequestorder(requestOrderToSign);
    console.log('signed requestOrder:', requestOrder);

    // matching orders
    const res = await orderModule.matchOrders({
      apporder: firstAppOrder?.order,
      requestorder: requestOrder,
      workerpoolorder: workerPoolOrder?.order
    });
    this.codeSendingStatus = 'Validation Requested'

    // get deal by its id
    const dealModule = IExecDealModule.fromConfig(this.iexec);
    const deal = await dealModule.show(res.dealid);
    const taskId = deal.tasks["0"];

    console.log('taksId: ', taskId);
    console.log('deal: ', deal);

    this.taskId = taskId;
  }
  async getResult() {
    // get needed task
    console.log('app called with parameters: ', `signature ${this.TOTPCode}`);
    const taskModule = IExecTaskModule.fromConfig(this.iexec);
    const response = await taskModule.fetchResults(this.taskId);
    const file = await response;
    console.log('execution final results: ', file.url);
    this.lastValidationResult = file.url
  }
}

