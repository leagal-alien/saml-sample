# Node.js(+ Express + passport-saml)でSAML認証

やってみた。

元： [OpenAM + Node.js(+ Express + passport-saml)でSAML認証](https://qiita.com/nsp01/items/d1b328e5698f6ffd8345)

ただし、OpenAM は面倒だったので、Azure AD のアプリの登録(プレビュー)を使った。

と、SAP の Cloud Platform の90日トライアルを利用して Cloud Foundry に push した。

ソースは、元のコピーで、何もしていない。

必要なものは、.env に書くことと、app.js の `secret: '123456', // 適切なものに変更してください` の部分を変える事。

実際のシークレットは、アプリの登録で 「認証とシークレット」から [新しいクライアントシークレット] で作成した。

シークレットも .env にしても良いかも。 ・・・　した。

.env は以下。

> .env

```
CALLBACK_URL=http://localhost:3000/login/callback
ENTRY_POINT=＜アプリの登録 で[エンドポイント]で表示される、SAML-P サインオン エンドポイント＞
ISSUER=＜アプリの登録 のアプリケーション (クライアント) ID＞
LOGOUT_URL=＜アプリの登録 で[エンドポイント]で表示される、SAML-P サインアウト エンドポイント＞
```

Cloud Foundry に push した場合は、アプリの登録の「リダイレクトURI」を Cloud Foundry のものにするのと、上記 CALLBACK_URL を合わせる必要がある。

## 手順メモ

環境

```bash
$ cat /etc/os-release
NAME="Ubuntu"
VERSION="18.04.1 LTS (Bionic Beaver)"
ID=ubuntu
ID_LIKE=debian
PRETTY_NAME="Ubuntu 18.04.1 LTS"
VERSION_ID="18.04"
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
VERSION_CODENAME=bionic
UBUNTU_CODENAME=bionic
```

```bash
$ node -v
v11.2.0
$ npm -v
6.4.1
$ express --version
4.16.0
```

### アプリの作成

```bash
$ express saml-sample --view=ejs --git
$ cd saml-sample

```

```bash
$ npm install dotenv --save
$ npm install passport --save
$ npm install passport-saml --save
$ npm install express-session --save
```

```bash
$ npm install
```

app.js  を元記事に沿って改造。express のバージョンが違うのか、記事のとおりではなかったので、日本語のコメントがあるところだけコピー。

routes/index.js の改造

で、Azure AD のアプリの登録後、

.env ファイルの作成


> Azure AD のアプリの登録

Azure ポータルにログイン、Azure Active Directory へ。

アプリの登録(プレビュー)

”＋新規登録”

名前は適当に。

リダイレクトURI に `http://localhost:3000/login/callback` 。

一番うしろに `/` (スラッシュ)を入れるとうまく動作しなかったので注意。

[エンドポイント] で SAML-P の値を確認、.env へ。

認証とシークレットで、[新しいクライアントシークレット]、app.js のExpressでセッションの箇所に記入。

　・・・　最終的に .env に CLIENT_SECRET と言うのを作成した。

## SAP Cloud Platform の Cloud Foundry に push

アカウントの登録は省略。　・・・ Web UI が分かりづらかった記憶。API エンドポイントの情報とか探すのに苦労した。

登録後はすべて、cf cli を使用して操作した。

manifest.yml の作成

```yaml
---
applications:
- name: saml-sample
  memory: 128MB
  instances: 1
  path: .
  buildpack: https://github.com/cloudfoundry/nodejs-buildpack
```

path はいらないかもしれない。

APIのエンドポイントの設定

```bash
$ cf api https://api.cf.us30.hana.ondemand.com
```

IBM Cloud もそうだがリージョンによって違うので注意。

ログイン

```bash
$ cf login
```

ユーザとパスワードを入力する。


> push

環境変数を登録するので、`--no-start` で起動しないようにする。


```bash
$ cf push --no-start
```

環境変数の設定


```bash
$ cf set-env saml-sample CALLBACK_URL ＜push したアプリのURL＞/login/callback
$ cf set-env saml-sample ENTRY_POINT ＜アプリの登録 で[エンドポイント]で表示される、SAML-P サインオン エンドポイント＞
$ cf set-env saml-sample ISSUER ＜アプリの登録 のアプリケーション (クライアント) ID＞
$ cf set-env saml-sample LOGOUT_URL ＜アプリの登録 で[エンドポイント]で表示される、SAML-P サインアウト エンドポイント＞
$ cf set-env saml-sample CLIENT_SECRET ＜アプリの登録で作成した クライアントシークレット＞

```

値は、適宜、`'`(シングルコーテションでくくる)。

起動


```bash
$ cf start
```

以上。


## 参考

* [OpenAM + Node.js(+ Express + passport-saml)でSAML認証](https://qiita.com/nsp01/items/d1b328e5698f6ffd8345)
* [express-session README.md の 翻訳](https://qiita.com/MahoTakara/items/8495bbafc19859ef463b)
* [アプリを Azure AD v2.0 エンドポイントに登録する](https://developer.microsoft.com/ja-jp/graph/docs/concepts/auth_register_app_v2)
* [How to create your own SAML-based application using new Azure Portal](https://tsmatz.wordpress.com/2016/12/29/azure-ad-saml-federation-application-tutorial/)
* [passport-saml](https://github.com/bergie/passport-saml)
* [express-session](https://github.com/expressjs/session)
* [Passprot.js](http://www.passportjs.org/)

## 私的φ(..)

ゆくゆくは、Cloud Foundry の [Route Service](https://docs.cloudfoundry.org/services/route-services.html) にしたいと思う。

そのメモ。

cookie(express-session) のオプションでスコープ Domain にしないとうまく行かないと思う。

認証後、要求元へのリダイレクトの直前に req に Cookie 渡す必要(があるかどうか？)

認証済みだったら、`req.pipe(request(url)).pipe(res);` か、`x-cf-forwarded-url` で要求元を表示してやる。

Route Service で X-CF-Proxy-Signature とか、X-CF-Proxy-Metadata とか、良く理解していないので、調べる。

----

node-rt-serv と言うサービスを作るとして。

```bash
$ cf push --no-start
```

※ アプリ情報は manifest.yml に記載

環境変数の設定 ・・・ 特有の設定ため無視で良い

```bash
$ cf set-env node-rt-serv CALLBACK_URL https://node-rt-serv.<Your Domain>/login/callback
$ cf set-env node-rt-serv ENTRY_POINT ＜アプリの登録 で[エンドポイント]で表示される、SAML-P サインオン エンドポイント＞
$ cf set-env node-rt-serv ISSUER ＜アプリの登録 のアプリケーション (クライアント) ID＞
$ cf set-env node-rt-serv LOGOUT_URL ＜アプリの登録 で[エンドポイント]で表示される、SAML-P サインアウト エンドポイント＞
$ cf set-env node-rt-serv CLIENT_SECRET '＜アプリの登録で作成した クライアントシークレット＞'
$ cf set-env node-rt-serv TARGET_REDIRECT https://<バインドするアプリのホスト＋Domain>
$ cf set-env node-rt-serv CLIENT_LOGIN_URL https://node-rt-serv.<Your Domain>/login

```

※　あと、COOKIE_DOMAIN というのも追加しないと・・・

起動

```bash
$ cf start node-rt-serv
```

サービスの作成

```bash
$ cf create-user-provided-service node-rt-serv -r https://<ROUTE-SERVICE-ADDRESS>
```

アプリにバインド

```bash
$ cf bind-route-service <APPLICATION-DOMAIN> node-rt-serv --hostname <APPLICATION-HOST>
```

アンバインド

```bash
$ cf unbind-route-service <APPLICATION-DOMAIN> node-rt-serv --hostname <APPLICATION-HOST>
```

削除

```bash
$ cf delete-service <service-instance>
```

必要に応じて、アプリとして push した本体も削除する。


