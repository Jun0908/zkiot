defmodule ZkBackend.Repo.Migrations.CreateDevice do
  use Ecto.Migration

  def change do
    create table(:device) do
      add :name, :string
      add :client_id, :string
      add :type, :string

      timestamps(type: :utc_datetime)
    end
  end
end
