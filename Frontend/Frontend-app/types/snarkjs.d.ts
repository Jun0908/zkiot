// file: types/snarkjs.d.ts
declare module "snarkjs" {
  export namespace groth16 {
    function fullProve(
      input: any,
      wasmPath: string,
      zkeyPath: string
    ): Promise<{ proof: any; publicSignals: string[] }>;

    function verify(
      vKey: any,
      publicSignals: string[],
      proof: any
    ): Promise<boolean>;

    function exportSolidityCallData(
      proof: any,
      publicSignals: string[]
    ): Promise<string>;
  }
}
