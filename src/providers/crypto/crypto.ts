import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthDataProvider } from '../auth-data/auth-data';
declare var require: any;

@Injectable()
export class CryptoProvider {

  arrAllCrypto: any[] = [];
  cryptocurrencies;
  // private readonly base_url: string = "https://min-api.cryptocompare.com/data/pricemultifull?fsyms="
  // private readonly base_url_CONTINUE: string = "&tsyms="
  constructor(
    public http: HttpClient,
    public authData:AuthDataProvider) {
    this.cryptocurrencies = require('cryptocurrencies');
  }

  getCrypto(num?:number): Promise<any> {    
    return new Promise((resolve) => {
      if ( this.arrAllCrypto.length != 0) {
        if (num == undefined) {
          resolve( this.arrAllCrypto);
        }else{
          let arr = [];
          for (let index = num; index < this.arrAllCrypto.length && index-num < 50 ; index++) {
            arr.push(this.arrAllCrypto[index])
          }
          resolve(arr);
        }
      }else{
        this.http.get("https://crypto.tradingcompare.com/AllPairs").toPromise()
        .then((data: any) => {
          let index = 0;
          for (const key in data) {
            if (this.cryptocurrencies[data[key]["fromSymbol"]] != undefined) {
              data[key]["name"] = this.cryptocurrencies[data[key]["fromSymbol"]];
              data[key]["sentiment"] = "none";
              data[key]["shortName"] = data[key]["name"].split(" ")[0];
              data[key]["state"] = "none";
              data[key]["index"] = index;
              data[key]["logo"] = "https://cloud-marketing66.herokuapp.com/logo/" + (data[key]["fromSymbol"]);
              data[key]["is_in_watchlist"] = false;
              data[key]["symbol"] = data[key]["pair"];
              data[key]["type"] = "CRYPTO";
              for (let index = 0; index < this.authData.user.watchlist.length; index++) {
                if (this.authData.user.watchlist[index].type == "CRYPTO") {
                  if ( data[key].symbol == this.authData.user.watchlist[index].symbol) {
                    data[key]["is_in_watchlist"] = true;
                    break;
                  }
                } 
              }
              this.arrAllCrypto.push(data[key]);
              index++;
            } 
          }
          console.log(this.arrAllCrypto);
          
          if (num == undefined) {
            resolve(this.arrAllCrypto);
          }else{
            let arr = [];
            for (let index = num; index < this.arrAllCrypto.length && index-num < 50 ; index++) {
              arr.push(this.arrAllCrypto[index])
            }
            resolve(arr);
          }
        })
      }
    })
  }

  search(str: string): any {
    var arrToRetrun = [];
    for (let index = 0; index < this.arrAllCrypto.length; index++) {
      let pair = this.arrAllCrypto[index]["fromSymbol"] + this.arrAllCrypto[index]["toSymbol"];
      if (((pair.toLowerCase()).indexOf(str.toLowerCase())>-1)||(((this.arrAllCrypto[index]["pair"]).toLowerCase()).indexOf(str.toLowerCase())>-1)||(((this.arrAllCrypto[index]["name"]).toLowerCase()).indexOf(str.toLowerCase())>-1) ) {
        arrToRetrun.push(this.arrAllCrypto[index])
      }
    }
    return arrToRetrun;
  }

  async get_by_symbol(str){
    if (this.arrAllCrypto.length == 0) {
      await this.getCrypto()
    }
    for (let index = 0; index < this.arrAllCrypto.length; index++) {
     if ( this.arrAllCrypto[index].symbol == str) {
       return  this.arrAllCrypto[index];
     }
    }
  }

}
