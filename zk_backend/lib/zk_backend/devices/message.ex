defmodule ZkBackend.Devices.Message do
  use Ecto.Schema
  import Ecto.Changeset

  alias ZkBackend.Devices
  alias ZkBackend.ZkServer

  schema "message" do
    field :message, :map
    field :topic, :string
    field :client_id, :string
    field :received_at, :utc_datetime
    field :proof, :map

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(message, params) do
    attrs = parse_attrs(params)

    message
    |> cast(attrs, [:topic, :client_id, :received_at, :message, :proof])
    |> validate_required([:topic, :client_id, :received_at])
  end

  defp parse_attrs(
         %{"clientId" => client_id, "receivedAt" => received_at, "topic" => topic} = params
       ) do
        proof = build_proof(params)
        %{
          "client_id" => client_id,
          "received_at" => parse_date(received_at),
          "topic" => topic,
          "message" => params,
          "proof" => %{"proof" => proof}
        }
  end

  defp build_proof(%{"t" => temp}) do
    scaled = temp * 100
    proof = ZkServer.run(%{"tScaled" => scaled})
  end

  defp build_proof(_other), do: ""

  defp parse_date(received_at) do
    case DateTime.from_unix(received_at) do
      {:ok, datetime} -> datetime
      _other -> DateTime.utc_now()
    end
  end
end
