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

