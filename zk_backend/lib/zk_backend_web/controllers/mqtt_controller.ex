defmodule ZkBackendWeb.MqttController do
  use ZkBackendWeb, :controller

  alias ZkBackend.Devices

  def new(conn, params) do
    case Devices.create_message(params) do
      {:ok, _message} ->
        conn
        |> put_status(200)
        |> json("ok")

      _other ->
        conn
        |> put_status(404)
        |> json("something failed")
    end
  end
end
