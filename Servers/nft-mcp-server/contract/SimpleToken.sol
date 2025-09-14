// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SuperSimpleToken is ERC20, Ownable {
    uint8 private constant _DECIMALS = 18;
    uint256 public constant FAUCET_AMOUNT = 100 * 10 ** 18;

    event Minted(address indexed to, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply // 0 でも OK。デプロイヤにミント
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
            emit Minted(msg.sender, initialSupply);
        }
    }

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /// @dev 誰でも呼べるファウセット。自分に固定額をミント
    function mint() external returns (uint256 newBalance) {
        _mint(msg.sender, FAUCET_AMOUNT);
        emit Minted(msg.sender, FAUCET_AMOUNT);
        return balanceOf(msg.sender);
    }

    /// @dev オーナーが任意アドレス・任意額をミント
    function mintTo(address to, uint256 amount)
        external
        onlyOwner
        returns (uint256 newTotalSupply)
    {
        _mint(to, amount);
        emit Minted(to, amount);
        return totalSupply();
    }
}
