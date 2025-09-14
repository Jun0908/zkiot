defmodule ZkBackend.ZkServer do
  # Notes this should be turned into a GenServer for scalability
  # Also to allow push notifications to the live view for updates i.e. cast, call, etc.
  # Also NEED TO ADD TESTS!!!

  @main_path "../zk-Ciruit"

  # Currently using dbg to show something is happening but not needed.
  # Also need to examine what steps are not needed and remove
  def run(data \\ %{"tScaled" => "3473"}) do
    input_path = create_temp_file(data)
    dbg(input_path)
    generate_witness(input_path) |> dbg()
    powers_new() |> dbg()
    powers_first_contribute() |> dbg()
    powers_prepare() |> dbg()
    powers_contribute() |> dbg()
    export_verification_key() |> dbg()
    prove() |> dbg()
    verify() |> dbg()
    export() |> dbg()
    {proof, _} = generate_call()
    proof
  end

  defp create_temp_file(data) do
    json = Jason.encode!(data)
    {:ok, file_path} = Temp.open "input.json", &IO.write(&1, json)

    file_path
  end

  defp generate_witness(input_path) do
    System.cmd("node", ["#{@main_path}/circuit2_js/generate_witness.js", "#{@main_path}/circuit2_js/circuit2.wasm", input_path, "#{@main_path}/witness.wtns"])
  end

  defp powers_new do
    System.cmd("snarkjs", ["powersoftau", "new", "bn128", "12", "#{@main_path}/pot12_0000.ptau", "-v"])
  end

  defp powers_first_contribute do
    # generate random text
    System.cmd("snarkjs", ["powersoftau", "contribute", "#{@main_path}/pot12_0000.ptau", "#{@main_path}/pot12_0001.ptau", "--name='First contribution'", "-v", "-e='some random text'"])
  end

  defp powers_prepare do
    System.cmd("snarkjs", ["powersoftau", "prepare", "phase2", "#{@main_path}/pot12_0001.ptau", "#{@main_path}/pot12_final.ptau", "-v"])
  end

  defp powers_contribute do
    # generate random text
   System.cmd("snarkjs", ["zkey", "contribute", "#{@main_path}/circuit2_0000.zkey", "#{@main_path}/circuit2_0001.zkey", "--name='This is working'", "-v", "-e='some random text'"])
  end

  defp export_verification_key do
    System.cmd("snarkjs", ["zkey", "export", "verificationkey", "#{@main_path}/circuit2_0001.zkey", "verification_key.json"])
  end

  defp prove do
    System.cmd("snarkjs", ["groth16", "prove", "#{@main_path}/circuit2_0001.zkey", "#{@main_path}/witness.wtns", "proof.json", "public.json"])
  end

  defp verify do
    System.cmd("snarkjs", ["groth16", "verify", "verification_key.json", "public.json", "proof.json"])
  end

  defp export do
   System.cmd("snarkjs", ["zkey", "export", "solidityverifier", "#{@main_path}/circuit2_0001.zkey", "#{@main_path}/verifier.sol"])
  end

  defp generate_call do
    System.cmd("snarkjs", ["generatecall"])
  end
end
