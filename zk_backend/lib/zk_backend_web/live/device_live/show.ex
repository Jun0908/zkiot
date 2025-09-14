defmodule ZkBackendWeb.DeviceLive.Show do
  use ZkBackendWeb, :live_view

  alias ZkBackend.Devices

  @impl true
  def mount(_params, _session, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_params(%{"id" => id}, _, socket) do
    {:noreply,
     socket
     |> assign(:page_title, page_title(socket.assigns.live_action))
     |> assign(:device, Devices.get_device!(id))}
  end

  defp page_title(:show), do: "Show Device"
  defp page_title(:edit), do: "Edit Device"
end
