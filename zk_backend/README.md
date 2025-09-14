# ZkBackend

To start your Phoenix server:
  * install Elixir
  * Run `mix setup` to install and setup dependencies
  * Start Phoenix endpoint with `mix phx.server` or inside IEx with `iex -S mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

Ready to run in production? Please [check our deployment guides](https://hexdocs.pm/phoenix/deployment.html).

## Learn more

  * Official website: https://www.phoenixframework.org/
  * Guides: https://hexdocs.pm/phoenix/overview.html
  * Docs: https://hexdocs.pm/phoenix
  * Forum: https://elixirforum.com/c/phoenix-forum
  * Source: https://github.com/phoenixframework/phoenix

## Post Elixir setup and can successfully the server
* Start Phoenix endpoint with `mix phx.server` or inside IEx with `iex -S mix phx.server`

* From PostMan or other API client make a request:
type: Post
IP: localhost:4000/api/mqtt/new
JSON body: {"topic":"devices/test_0818/telemetry","clientId":"test_0818","receivedAt":1756365421799,"t":34.73,"h":34.7,"p":1011.6,"g":376886,"deviceTs":1756365421}

* Open the [localhost:4000/message](http://localhost:4000/message)

You should see an index page with all the messages listed.
If you make another API call simply refresh and see the new message.
In the future the refresh can be handled with async calls (handle_info etc.) from the LiveView