# ledgr

A privacy-first personal finance manager. See: [ledgr.money](https://ledgr.money).

Try the [demo site](https://demo.ledgr.money).

## What is it?

**ledgr** is a personal finance manager where your data is kept on-device and not sent to any servers for storage or analysis. It allows users to import their bank statements and transactions into the app, categorize expenses and stay on top of their spending.

## Why ledgr?

Almost all expense managers require you to either connect your bank account or give access to your email or messages, so they can automatically track expenses. They collect your private financial data and send it off to their servers. It doesn't have to be this way - your financial data belongs to you, and needs to stay private.  

**ledgr** aims to give you complete control over your financial data. All your transaction data is stored on your device, and is never sent to any servers. To avoid having to connect your bank account or email, **ledgr** allows you to import your bank statements and transactions into the app.

See the [Privacy Policy](https://ledgr.money/privacy-policy) for more details.

## Contributing

Pull requests and contributions to **ledgr** are welcome!

### Setup for development

1. Clone the repository
```bash
git clone https://github.com/ledgr-money/ledgr.git
```

2. Install dependencies
```bash
npm install
```

3. Setup env variables
```bash
cp .env.template .env

# Update .env and set appropriate values
```

4. Start the development server
```bash
npm run dev
```
