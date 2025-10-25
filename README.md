This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).



# ビルド・実行方法

## ビルド方法

### ①Github からクローンする

Github からクローンし、必要なブランチをチェックアウトする


### フロントエンド

フロントエンドは、システム固有の設定ファイルはリポジトリに含まれていないため、以下の手順で設定ファイルを作成する

直下に、.env ファイルを作成し、以下の内容を記述する

```

DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET=シークレットを生成する
NEXTAUTH_URL=http://localhost:3000

```

保存後以下のコマンドを実行する

```bash
>npm install
>npm run dev
```