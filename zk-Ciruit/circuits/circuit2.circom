pragma circom 2.0.0;

include "circomlib/circuits/bitify.circom";

// Prove that tScaled (temperature * 100) is at most 3700 (i.e., <= 37.00°C).
template TempAtMost37() {
    // Private input: temperature scaled by 100 (e.g., 36.99°C -> 3699)
    signal input tScaled;
    signal output ok;

    // (1) Range bound for tScaled: assume 16 bits is enough
    component tBits = Num2Bits(16);
    tBits.in <== tScaled;

    // (2) diff = 3700 - tScaled
    //     If tScaled <= 3700, then diff is 0..3700 (fits in 12 bits)
    signal diff;
    diff <== 3700 - tScaled;

    component dBits = Num2Bits(12);
    dBits.in <== diff;

    ok <== 1;
}

component main = TempAtMost37();


