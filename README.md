**Project Demo**

There are two ways to access the running web demo:

- **Option 1 — Public demo (Render)**: use the deployed web at `https://socket-group-32.onrender.com/`.
  - Note: Render may put the service to sleep when it is inactive for a while. If you open the site while it was put to sleep, Render will re-deploy the app and it may some time before the site becomes available — please wait for the re-deployment.

- **Option 2 — Run locally**: run the server on your device and connect to `http://localhost:3000/` in a browser.

**Local run (Windows `cmd.exe`)**

1. Clone this repository into your device

2. Install dependencies in the cloned project root:

```
npm install
```

3. Create a `.env` file in the project root with `MONGO_URI` var containing your MongoDB connection string.
Example contents:

```
MONGO_URI=mongodb+srv://<dbuser>:<dbpassword>@cluster0.abcd.mongodb.net/<dbname>
```

4. Start the server:

```
npm run dev
```

5. Open the locally demo web in your browser: `http://localhost:3000/`

**Troubleshooting**

- If the app logs a MongoDB connection error: check `MONGO_URI` in your `.env`, then ensure the database user and network access are configured.
- Contact the project's owner if you have any problem connecting to the site.