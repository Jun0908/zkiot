defmodule ZkBackend.Devices.Device do
  use Ecto.Schema
  import Ecto.Changeset

  schema "device" do
    field :name, :string
    field :type, :string
    field :client_id, :string

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(device, attrs) do
    device
    |> cast(attrs, [:name, :client_id, :type])
    |> validate_required([:name, :client_id, :type])
  end
end
