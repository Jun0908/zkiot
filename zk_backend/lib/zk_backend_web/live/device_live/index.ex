defmodule ZkBackendWeb.DeviceLive.Index do
  use ZkBackendWeb, :live_view

  alias ZkBackend.Devices
  alias ZkBackend.Devices.Device

  @impl true
  def mount(_params, _session, socket) do
    {:ok, stream(socket, :device_collection, Devices.list_device())}
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(socket, :edit, %{"id" => id}) do
    socket
    |> assign(:page_title, "Edit Device")
    |> assign(:device, Devices.get_device!(id))
  end

  defp apply_action(socket, :new, _params) do
    socket
    |> assign(:page_title, "New Device")
    |> assign(:device, %Device{})
  end

  defp apply_action(socket, :index, _params) do
    socket
    |> assign(:page_title, "Listing Device")
    |> assign(:device, nil)
  end

  @impl true
  def handle_info({ZkBackendWeb.DeviceLive.FormComponent, {:saved, device}}, socket) do
    {:noreply, stream_insert(socket, :device_collection, device)}
  end

  @impl true
  def handle_event("delete", %{"id" => id}, socket) do
    device = Devices.get_device!(id)
    {:ok, _} = Devices.delete_device(device)

    {:noreply, stream_delete(socket, :device_collection, device)}
  end
end
