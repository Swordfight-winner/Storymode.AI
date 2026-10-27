# Storymode.AI

A small web app for turning a story idea into original fiction, one chapter at a time, with the OpenAI API. Choose a genre, mood, and chapter length. After each chapter, pick from three suggested directions or write your own before continuing. The most recent 40,000 characters of previous chapters are included as context so the story can follow its characters and events.

## Run locally

Requires Python 3. No third-party Python packages are needed.

1. Open the `.env` file in the project folder and paste your OpenAI API key after `OPENAI_API_KEY=`:

   ```dotenv
   OPENAI_API_KEY=your-actual-api-key
   ```

   Keep the key private. The `.env` file is excluded from Git. You can also start from `.env.example`.

2. Optionally choose a model by adding `OPENAI_MODEL=gpt-4o-mini` to `.env`. The default is `gpt-4o-mini`.

3. Start (or restart) the server:

   ```sh
   python3 server.py
   ```

4. Open [http://127.0.0.1:8000](http://127.0.0.1:8000).

The API key is used only by the Python server and is never sent to the browser. The server listens on localhost by default.
