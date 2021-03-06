import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Profile } from '../../models/profile-model';
import { ModalController, Platform, Loading } from 'ionic-angular';
import { Facebook } from '@ionic-native/facebook';
import { GooglePlus } from '@ionic-native/google-plus';
import { InAppPurchase2, IAPProduct } from '@ionic-native/in-app-purchase-2';
import firebase from 'firebase';
import { CountryModel } from '../../models/country-model';
import { Nexmo } from '../../models/nexmo-model';
import { GlobalProvider } from '../global/global';



@Injectable()
export class AuthDataProvider {
  localCountry: CountryModel = new CountryModel();
  isAuth: boolean = false
  user: Profile = new Profile();
  platform: any = "browser";
  constructor(
    private store: InAppPurchase2,
    private googlePlus: GooglePlus,
    public facebook: Facebook,
    public modalCtrl: ModalController,
    public http: HttpClient,
    public plt: Platform
  ) {
    console.log("constructor AuthDataProvider");
  }
  /* from here I used these functions */



  providerLogin(m_provider): Promise<firebase.User> {
    if (m_provider == "facebook") {
      return new Promise((resolve, reject) => {
        this.facebook.login(['email'])
          .then(response => {
            const facebookCredential = firebase.auth.FacebookAuthProvider
              .credential(response.authResponse.accessToken);
           firebase.auth().signInWithCredential(facebookCredential)
              .then((success) => {
                resolve(success)
              });
          }).catch((error) => {
            console.log("error", error);
            reject(error)
          });
      })
    }
    else if (m_provider == "google") {
      return new Promise((resolve, reject) => {
        this.googlePlus.login({
          'webClientId': '212982281977-nrar31o20thlvs4k7f3civmhtthcg94i.apps.googleusercontent.com',
        }).then(response => {
          console.log(response);
          const googleCrendential = firebase.auth.GoogleAuthProvider
            .credential(response.idToken);
            firebase.auth().signInWithCredential(googleCrendential)
            .then(success => {
              resolve(success);
            })
            .catch(err => {
              alert(err + "error");
            })
        }).catch((error) => { reject(error) });
      })
    }
  }

  getContry(): Promise<CountryModel> {
    return new Promise((resolve, reject) => {
      if (this.localCountry.isRequested) {
        resolve(this.localCountry);
      } else {
        this.http.get("https://xosignals.herokuapp.com/get-location").toPromise()
          .then((data: CountryModel) => {
            Object.keys(this.localCountry).forEach(key => this.localCountry[key] = data[key]);
            this.localCountry.isRequested = true;
            this.http.get('../../assets/lot of data/countries.json')
              .toPromise()
              .then(response => {
                for (let index = 0; index < response["countries"].length; index++) {
                  if (((response["countries"][index].name) as string).toLocaleUpperCase() == (data.country as string).toLocaleUpperCase()) {
                    this.localCountry.dial_code = response["countries"][index].dial_code;
                    break;
                  }
                }
                resolve(this.localCountry);
              })

          })
          .catch(err => {
            resolve(undefined)
          })
      }
    })
  }


  signupUser(profile: Profile, loading: Loading): Promise<any> {
    return new Promise((resolve, reject) => {
      loading.setContent("create user with email and password...");
      firebase.auth().createUserWithEmailAndPassword(profile.email, profile.password)
        .then((newUser) => {
          console.log("new User", newUser);
          
          profile._id = newUser.uid;
          profile.platform = (this.plt.is('ios')) ? "ios" : "android";
          profile.provider = "password";
          profile.createAccountDate = new Date().toLocaleDateString();
          this.user = profile;
          loading.setContent("keep profile in server...");
          this.keepProfileInServer(profile)
            .then(data => {
              resolve(data);
            })
            .catch(err => {
              reject(err);
            })
        })
        .catch(err => {
          reject(err);
        })
    })
  }

  deleteProfile(_id: String): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post("https://xosignals.herokuapp.com/trading-compare-v2/delete-user", { _id: _id })
        .toPromise()
        .then((newUserServer) => {
          console.log(newUserServer);

          resolve(newUserServer);
        })
        .catch((err) => {
          console.log("err7676767", err);

          reject("error in our server.");
        })
    })
  }


  keepProfileInServer(profile: Profile): Promise<Profile> {
    return new Promise((resolve, reject) => {
      this.http.post("https://xosignals.herokuapp.com/trading-compare-v2/createUser", profile)
        .toPromise()
        .then((newUserServer) => {
          resolve(profile);
        })
        .catch((err) => {
          reject("error in our server.");
        })
    })
  }

  sendVerifyCode(loading: Loading): Promise<any> {
    loading.setContent("sending verifing code to your Phone device..");
    return new Promise((resolve, reject) => {
      console.log("avi", this.user);

      this.http.post("https://xosignals.herokuapp.com/trading-compare-v2/send-user-verify-code", this.user).toPromise()
        .then((data: any) => {
          console.log(data);
          
          if (data.status == "0") {
           
            this.user.verifyData.verify_id = data.request_id;
            this.user.verifyData.is_verify_code_sent = true;
            var x = {
              "verifyData": this.user.verifyData
            }
            this.updateFields(x).then(() => {
              console.log("promise from this.updateFields()",x);
            })
            resolve("A SMS has sent to you.");
          } else { // in futur need check the status response and to response as well
            reject(data);
          }

        })
        .catch(err => {
          console.log(err, "sendUserVerifyCode");
        })
    })

  }

  updateFields(fieldsToUpdate): Promise<any> {
    fieldsToUpdate["_id"] = this.user._id;
    return new Promise((resolve) => {
      this.http.post("https://xosignals.herokuapp.com/trading-compare-v2/update-fields", fieldsToUpdate)
        .toPromise()
        .then(() => {
          console.log("server updated field", fieldsToUpdate);
          resolve();
        })
        .catch((err) => {
          console.log(err);

        })
    })

  }

  checkCode(verify_code): Promise<boolean> {
    return new Promise(resolve => {
      var data = {
        _id: this.user._id,
        verify_code: verify_code
      }
      this.http.post("https://xosignals.herokuapp.com/trading-compare-v2/matchUserVerifyCode", data).toPromise()
        .then(data => {
          console.log(data);

          if (data == "ok") {
          
           this.user.verifyData.is_phone_number_verified = true;
           this.user.verifyData.verify_code = verify_code;
           
            var x = {
              "verifyData":  this.user.verifyData
            }
            this.updateFields(x).then(() => {
              console.log("promise from this.updateFields()",x);
              resolve(true);
            })
          } else {
            resolve(false);
          }
        })
        .catch((err) => {
          console.log("err", err);
          resolve(false);
        })
    })
  }

  getProfileFromServer(_id: string): Promise<Profile> {
    console.log(_id);
    
    return new Promise((resolve, reject) => {
      this.http.post("https://xosignals.herokuapp.com/trading-compare-v2/getUsersById", { _id: _id })
        .toPromise()
        .then((profile: Profile) => {
          resolve(profile);
          console.log(profile);
          
        })
        .catch((err) => {
          console.error(err);
          if (err.status == 500) {
            reject(err.error);
          } else {
            reject(err);
          }
        })
    })
  }
  
  loginUserWithProvider(m_provider: string): Promise<Profile> {
    var provider;
    switch (m_provider) {
      case "facebook":
        provider = new firebase.auth.FacebookAuthProvider();
        break;
      case "google":
        provider = new firebase.auth.GoogleAuthProvider();
      default:
        break;
    }

    //real device
    if (this.plt.is("cordova")) {
      return new Promise((resolve, reject) => {
        this.providerLogin(m_provider).then((profileFireBase) => {

          this.getProfileFromServer(profileFireBase.uid)
            .then((user: Profile) => {
              console.log("user", user);
              resolve(user);
            })
            .catch(() => {
              console.log("user created in firebase but not exsist in mongo");
              this.getProfileWithFirebaseUser(profileFireBase);
              this.user.provider = m_provider;
              this.keepProfileInServer(this.user).then(() => {
                resolve(this.user);
              })
                .catch(() => {
                  reject("error in server")
                })
            })
        }).catch((err) => {
          console.log("err from firebase", err);
          reject(err)
        })
      })
    }


    //browser
    else {
      return new Promise((resolve, reject) => {
        firebase.auth().signInWithPopup(provider).then((profileFireBase) => {

          this.getProfileFromServer(profileFireBase.user.uid)
            .then((user: Profile) => {
              console.log("user", user);
              resolve(user);
            })
            .catch(() => {
              console.log("user created in firebase but not exsist in mongo");
              this.getProfileWithFirebaseUser(profileFireBase.user);
              this.user.provider = m_provider;
              this.keepProfileInServer(this.user).then(() => {
                resolve(this.user);
              })
                .catch(() => {
                  reject("error in server")
                })
            })
        }).catch((err) => {
          console.log("err from firebase", err);
          reject(err)
        })
      })
    }
  }


  /* until here I used these functions */



  resetPassword(email: string): Promise<void> {
    return firebase.auth().sendPasswordResetEmail(email);
  }



  

  loginUserViaEmail(email: string, password: string): Promise<any> {
    return firebase.auth().signInWithEmailAndPassword(email, password)
  }

  logoutUser(): Promise<any> {
    return firebase.auth().signOut();
  }






  getProfileWithFirebaseUser(user: firebase.User) {
    if (user.displayName != null) {
      let displayName = user.displayName.split(" ");
      if (displayName.length >= 2) {
        this.user.first_name = displayName[0]
        for (let index = 1; index < displayName.length - 1; index++) {
          this.user.last_name += displayName[index] + " "
        }
        this.user.last_name += displayName[displayName.length - 1];
      } else {
        this.user.first_name = user.displayName;
      }
    }
    this.user.email = user.email;
    this.user._id = user.uid;
    this.user.platform = this.platform;
    this.user.createAccountDate = new Date().toLocaleDateString();
  }


  updatePhone(phone: {
    dial_code: string,
    phone_number: string,
    country: string
    broker: string
  }) {
    this.user.countryData.country = phone.country
    this.user.countryData.dial_code = phone.dial_code
    this.user.phone_number = phone.phone_number
    this.user.broker = phone.broker
    // this.sendVerifyCode().then(
  }

  updateProfileChangeinServer(data2) {
    this.http.post("https://xosignals.herokuapp.com/api2/updateProfileChangeinServer", data2).toPromise().then(data => data)
    alert("Profile Updated Successfully ");
  }
  // getBrokerByName(){
  //   this.http.get("./assets/lot of data/brokers.json")
  //   .toPromise()
  //   .then((response) => {

  //      for (let index = 0; index < response["brokers"].length; index++) {
  //        if( response["brokers"][index].name == this.user.broker ){
  //         this.user.brokerimg=response["brokers"][index].img 

  //        break}
  //      }
  //   })
  // }
  // async initializeStore() {
  //   this.productMouth.appleProductId = "com.vip.1Month"
  //   this.productMouth.googleProductId = "com.vip.month"
  //   this.productMouth.name = "trading signals (1 month)"

  //   this.productYear.appleProductId = "com.vip.1Year"
  //   this.productYear.googleProductId = "com.vip.year"
  //   this.productYear.name = "trading signals (1 year)"

  //   if (!this.plt.is('cordova')) { return };
  //   var productMouth_id = ""
  //   var productYear_id = ""
  //   if (this.plt.is('ios')) {
  //     productMouth_id = this.productMouth.appleProductId
  //     productYear_id = this.productYear.appleProductId
  //   } else {
  //     productMouth_id = this.productMouth.googleProductId
  //     productYear_id = this.productYear.googleProductId
  //   }


  //   this.store.verbosity = this.store.INFO;
  //   this.store.refresh()
  //   InAppPurchase2.getPlugin().ready(() => {
  //     this.store.register({
  //       id: productMouth_id,
  //       alias: productMouth_id,
  //       type: this.store.NON_RENEWING_SUBSCRIPTION
  //     });
  //     this.store.register({
  //       id: productYear_id,
  //       alias: productYear_id,
  //       type: this.store.NON_RENEWING_SUBSCRIPTION
  //     });

  //     this.store.refresh();

  //     this.store.when(this.productMouth.appleProductId).cancelled(() => {
  //       console.log("cancelled")
  //     })
  //     this.store.when(this.productYear.appleProductId).cancelled(() => {
  //       console.log("cancelled")
  //     })

  //     this.store.when(this.productMouth.googleProductId).approved((product: IAPProduct) => {
  //       product.finish()
  //       this.user.state = "approved";
  //       this.updateIdOneSignals()
  //       console.log("approved")
  //     })
  //     this.store.when(this.productYear.appleProductId).approved((product: IAPProduct) => {
  //       product.finish()
  //       this.user.state = "approved";
  //       this.updateIdOneSignals()
  //       console.log("approved")
  //     })

  //     this.store.when(this.productYear.googleProductId).owned((product: IAPProduct) => {
  //       product.finish()
  //       this.updateIdOneSignals()
  //       this.user.state = "approved";
  //       console.log("owned")
  //     })
  //     this.store.when(this.productYear.appleProductId).owned((product: IAPProduct) => {
  //       product.finish()
  //       this.updateIdOneSignals()
  //       this.user.state = "approved";
  //       console.log("owned")
  //     })
  //   })
  // }


  // updateIdOneSignals(): Promise<any> {
  //   return this.http.post("https://xosignals.herokuapp.com/api2/insertVipUser", {
  //     _id: this.user._id,
  //     notificationId: this.user.notificationId
  //   }).toPromise()
  // }

  updatenotificationId(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!(document.URL.startsWith('http') || document.URL.startsWith('http://localhost:8080'))) {

        this.plt.ready().then(() => {
          // this.oneSignal.getIds().then(data=>{
          //   this.user.notificationId = data.userId
          //    this.http.post("https://xosignals.herokuapp.com/api2/updatenotificationId", {
          //     _id: this.user._id,
          //     notificationId: this.user.notificationId
          //   }).toPromise().then(()=>{
          //     resolve("ok")
          //   }).catch(()=>{
          //     reject("error")
          //   })
          // })
        })
      }
    })

  }



}

