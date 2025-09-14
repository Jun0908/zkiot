// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SuperSimpleNFT is ERC721, Ownable {
    uint256 private _nextTokenId = 1;

    event Minted(address indexed to, uint256 indexed tokenId);

    constructor(string memory name_, string memory symbol_)
        ERC721(name_, symbol_)
        Ownable(msg.sender)
    {}

    /// @dev 誰でも実行可。呼び出し元に1枚ミント。発行 tokenId を返す
    function mint() external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        emit Minted(msg.sender, tokenId);
        return tokenId;
    }

    /// @dev オーナーが任意アドレスへミント。発行 tokenId を返す
    function mintTo(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        emit Minted(to, tokenId);
        return tokenId;
    }
}
