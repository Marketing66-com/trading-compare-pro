import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { StockProvider } from '../stock/stock';
import { CryptoProvider } from '../crypto/crypto';
import { ForexProvider } from '../forex/forex';
import { AuthDataProvider } from '../auth-data/auth-data';

@Injectable()
export class GlobalProvider {
  sentiments=[];
  constructor
  ( public http: HttpClient,
    public cryptoProvider:CryptoProvider,
    public stockProvider:StockProvider,
    public forexProvider:ForexProvider,
    public authData:AuthDataProvider
  ) {
   
  }
  add_to_watchlist(symbol:string,type:string){
    let dataTOSEND = {
      data:{
        symbol:symbol,
        type:type
      },
      _id:this.authData.user._id
    }
    this.http.post("https://xosignals.herokuapp.com/trading-compare-v2/add-to-watchlist",dataTOSEND)
    .toPromise()
    .then(data=>{
      console.log(symbol + " added");
      this.authData.user.watchlist.push(dataTOSEND.data);
    })
    .catch(err=>{
      console.log("err",err);
      
    })
  }

  remove_from_watchlist(symbol:string,type:string,i?:number){

    if (i!=undefined) {
      switch (type) {
        case "STOCK":
          for (let index = 0; index < this.stockProvider.allStocks.length; index++) {
            for (let j = 0; j < this.stockProvider.allStocks[index].data.length; j++) {
              if ( this.stockProvider.allStocks[index].data[j].symbol == symbol) {
                this.stockProvider.allStocks[index].data[j].is_in_watchlist = false;
              }
            }
          }
          break;

          case "FOREX":
          for (let index = 0; index < this.forexProvider.allForex.length;index++) {
            if ( this.forexProvider.allForex[index].symbol == symbol) {
              this.forexProvider.allForex[index].is_in_watchlist = false;
            }
          }
          break;

          case "CRYPTO":
          for (let index = 0; index < this.cryptoProvider.arrAllCrypto.length;index++) {
            if ( this.cryptoProvider.arrAllCrypto[index].symbol == symbol) {
              this.cryptoProvider.arrAllCrypto[index].is_in_watchlist = false;
            }
          }
          break;
      
        default:
          break;
      }
    }

    for (let index = 0; index < this.authData.user.watchlist.length; index++) {
      if (this.authData.user.watchlist[index].symbol == symbol) {
        this.authData.user.watchlist.splice(index, 1);
        break;
      }
    }
    let dataTOSEND = {
      data:{
        symbol:symbol,
        type:type
      },
      _id:this.authData.user._id
    }
    this.http.post("https://xosignals.herokuapp.com/trading-compare-v2/remove-from-watchlist",dataTOSEND)
    .toPromise()
    .then(data=>{

    })
    .catch(err=>{
      console.log("err",err);
      
    })
  }


  add_sentiment(symbol:string,type:string,symbol_type:string,price:number):Promise<any>{
    return new Promise((resolve,reject)=>{
      var dataToSend = {
        _id:this.authData.user._id,
        symbol:symbol,
        symbol_type:symbol_type,
        type:type,
        price:price
      }
      this.http.post("https://xosignals.herokuapp.com/trading-compare-v2/add-sentiment",dataToSend)
      .toPromise()
      .catch(err=>{
        reject(err)
      })
      .then(()=>{
        console.log("sentiment added in database succssed .");
        resolve();
      })
     
    })

  }

  
  close_sentiment(symbol:string,type:string,close_price:number):Promise<any>{
    return new Promise((resolve,reject)=>{
      var dataToSend = {
        _id:this.authData.user._id,
        symbol:symbol,
        type:type,
        close_price:close_price
      }
      this.http.post("https://xosignals.herokuapp.com/trading-compare-v2/close-sentiment",dataToSend)
      .toPromise()
      .catch(err=>{
        reject(err)
      })
      .then(()=>{
        console.log("sentiment removed in database succssed.");
        resolve();
      })
     
    })

  }

  get_sentiments():Promise<any>{
    return new Promise((resolve,reject)=>{
      this.http.get("https://xosignals.herokuapp.com/trading-compare-v2/get-sentiments-by-user/"+this.authData.user._id).toPromise().then((data:any)=>{
        this.sentiments = data;
        resolve(this.sentiments);
      }).catch((err)=>{
        reject(err)
      })
    })
    
  }

}
