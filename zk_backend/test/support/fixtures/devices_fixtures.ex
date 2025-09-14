defmodule ZkBackend.DevicesFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `ZkBackend.Devices` context.
  """

  @doc """
  Generate a device.
  """
  def device_fixture(attrs \\ %{}) do
    {:ok, device} =
      attrs
      |> Enum.into(%{
        client_id: "some client_id",
        name: "some name",
        type: "some type"
      })
      |> ZkBackend.Devices.create_device()

    device
  end

  @doc """
  Generate a message.
  """
  def message_fixture(attrs \\ %{}) do
    {:ok, message} =
      attrs
      |> Enum.into(%{
        client_id: "some client_id",
        message: %{},
        received_at: ~U[2025-09-12 08:04:00Z],
        topic: "some topic"
      })
      |> ZkBackend.Devices.create_message()

    message
  end
end
