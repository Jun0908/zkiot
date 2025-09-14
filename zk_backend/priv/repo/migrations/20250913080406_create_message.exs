defmodule ZkBackend.Repo.Migrations.CreateMessage do
  use Ecto.Migration

  def change do
    create table(:message) do
      add :topic, :string
      add :client_id, :string
      add :received_at, :utc_datetime
      add :message, :map
      add :proof, :map

      timestamps(type: :utc_datetime)
    end
  end
end
