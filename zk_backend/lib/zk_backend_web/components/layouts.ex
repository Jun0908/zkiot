defmodule ZkBackendWeb.Layouts do
  @moduledoc """
  This module holds different layouts used by your application.

  See the `layouts` directory for all templates available.
  The "root" layout is a skeleton rendered as part of the
  application router. The "app" layout is set as the default
  layout on both `use ZkBackendWeb, :controller` and
  `use ZkBackendWeb, :live_view`.
  """
  use ZkBackendWeb, :html

  embed_templates "layouts/*"
end
