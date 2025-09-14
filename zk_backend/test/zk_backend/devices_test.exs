defmodule ZkBackend.DevicesTest do
  use ZkBackend.DataCase

  alias ZkBackend.Devices

  describe "device" do
    alias ZkBackend.Devices.Device

    import ZkBackend.DevicesFixtures

    @invalid_attrs %{name: nil, type: nil, client_id: nil}

    test "list_device/0 returns all device" do
      device = device_fixture()
      assert Devices.list_device() == [device]
    end

    test "get_device!/1 returns the device with given id" do
      device = device_fixture()
      assert Devices.get_device!(device.id) == device
    end

    test "create_device/1 with valid data creates a device" do
      valid_attrs = %{name: "some name", type: "some type", client_id: "some client_id"}

      assert {:ok, %Device{} = device} = Devices.create_device(valid_attrs)
      assert device.name == "some name"
      assert device.type == "some type"
      assert device.client_id == "some client_id"
    end

    test "create_device/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Devices.create_device(@invalid_attrs)
    end

    test "update_device/2 with valid data updates the device" do
      device = device_fixture()

      update_attrs = %{
        name: "some updated name",
        type: "some updated type",
        client_id: "some updated client_id"
      }

      assert {:ok, %Device{} = device} = Devices.update_device(device, update_attrs)
      assert device.name == "some updated name"
      assert device.type == "some updated type"
      assert device.client_id == "some updated client_id"
    end

    test "update_device/2 with invalid data returns error changeset" do
      device = device_fixture()
      assert {:error, %Ecto.Changeset{}} = Devices.update_device(device, @invalid_attrs)
      assert device == Devices.get_device!(device.id)
    end

    test "delete_device/1 deletes the device" do
      device = device_fixture()
      assert {:ok, %Device{}} = Devices.delete_device(device)
      assert_raise Ecto.NoResultsError, fn -> Devices.get_device!(device.id) end
    end

    test "change_device/1 returns a device changeset" do
      device = device_fixture()
      assert %Ecto.Changeset{} = Devices.change_device(device)
    end
  end

  describe "message" do
    alias ZkBackend.Devices.Message

    import ZkBackend.DevicesFixtures

    @invalid_attrs %{message: nil, topic: nil, client_id: nil, received_at: nil}

    test "list_message/0 returns all message" do
      message = message_fixture()
      assert Devices.list_message() == [message]
    end

    test "get_message!/1 returns the message with given id" do
      message = message_fixture()
      assert Devices.get_message!(message.id) == message
    end

    test "create_message/1 with valid data creates a message" do
      valid_attrs = %{
        message: %{},
        topic: "some topic",
        client_id: "some client_id",
        received_at: ~U[2025-09-12 08:04:00Z]
      }

      assert {:ok, %Message{} = message} = Devices.create_message(valid_attrs)
      assert message.message == %{}
      assert message.topic == "some topic"
      assert message.client_id == "some client_id"
      assert message.received_at == ~U[2025-09-12 08:04:00Z]
    end

    test "create_message/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Devices.create_message(@invalid_attrs)
    end

    test "update_message/2 with valid data updates the message" do
      message = message_fixture()

      update_attrs = %{
        message: %{},
        topic: "some updated topic",
        client_id: "some updated client_id",
        received_at: ~U[2025-09-13 08:04:00Z]
      }

      assert {:ok, %Message{} = message} = Devices.update_message(message, update_attrs)
      assert message.message == %{}
      assert message.topic == "some updated topic"
      assert message.client_id == "some updated client_id"
      assert message.received_at == ~U[2025-09-13 08:04:00Z]
    end

    test "update_message/2 with invalid data returns error changeset" do
      message = message_fixture()
      assert {:error, %Ecto.Changeset{}} = Devices.update_message(message, @invalid_attrs)
      assert message == Devices.get_message!(message.id)
    end

    test "delete_message/1 deletes the message" do
      message = message_fixture()
      assert {:ok, %Message{}} = Devices.delete_message(message)
      assert_raise Ecto.NoResultsError, fn -> Devices.get_message!(message.id) end
    end

    test "change_message/1 returns a message changeset" do
      message = message_fixture()
      assert %Ecto.Changeset{} = Devices.change_message(message)
    end
  end
end
