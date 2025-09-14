defmodule ZkBackend.Repo do
  use Ecto.Repo,
    otp_app: :zk_backend,
    adapter: Ecto.Adapters.Postgres

  def fetch(query, message \\ :not_found) do
    case one(query) do
      nil -> {:error, message}
      struct -> {:ok, struct}
    end
  end
end
