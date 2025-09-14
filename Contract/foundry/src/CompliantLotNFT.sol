// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Compliant Lot NFT (voucher-based mint, OZ v5 slim)
 * - Off-chain Verify → MCP署名(EIP-712 Voucher) → on-chain署名検証してMint
 * - 生ログは秘匿、commitRoot/vkHash/schema/periodHash/deviceHashのみ保存
 * - commitRoot二重使用防止、nonceリプレイ防止、期限切れ拒否
 * - 任意でKYCゲート & revoke
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract CompliantLotNFT is ERC721, EIP712, Ownable {
    using ECDSA for bytes32;

    /* ---------- errors (短い=バイトコード削減) ---------- */
    error SignerNotSet();
    error VoucherExpired();
    error NonceUsed();
    error CommitRootUsed();
    error TokenExists();
    error InvalidSigner();
    error NoToken();
    error RevokedLot();
    error FromNotKYC();
    error ToNotKYC();

    /* ------------------- types & storage ------------------- */
    struct MintVoucher {
        address to;
        uint256 tokenId;        // 推奨: keccak(commitRoot, period, device) 由来
        bytes32 commitRoot;     // 生ログのMerkle root
        bytes32 vkHash;         // 回路/検証鍵ハッシュ
        bytes32 schema;         // 例: keccak256("T<=37C:all-samples")
        bytes32 periodHash;     // keccak256(bytes(period))
        bytes32 deviceHash;     // keccak256(bytes(device ENS/name))
        string  tokenURI;       // 任意
        uint64  deadline;       // 期限（epoch秒）
        bytes32 nonce;          // リプレイ防止
    }

    struct ProofMeta {
        bytes32 commitRoot;
        bytes32 vkHash;
        bytes32 schema;
        bytes32 periodHash;
        bytes32 deviceHash;
        uint64  mintedAt;
        bool    revoked;
    }

    // EIP-712
    address public mintSigner;

    // lot/proof
    mapping(uint256 => ProofMeta) public proofOf;        // tokenId => meta
    mapping(bytes32  => bool)     public usedNonce;      // voucher nonce
    mapping(bytes32  => bool)     public usedCommitRoot; // commitRoot再使用防止

    // tokenURI（軽量のため自前管理）
    mapping(uint256 => string) private _tokenURIs;

    // 任意のKYCゲート
    mapping(address => bool) public kyc;
    bool public enforceKycTransfers;

    /* ------------------------ events ------------------------ */
    event MintSignerSet(address indexed signer);
    event Minted(uint256 indexed tokenId, address indexed to, bytes32 commitRoot, bytes32 schema);
    event Revoked(uint256 indexed tokenId, string reason);
    event ClaimAppended(uint256 indexed tokenId, bytes32 claimHash, string note);
    event KycSet(address indexed who, bool allowed);
    event EnforceKycTransfers(bool enabled);

    /* --------------------- constructor ---------------------- */
    constructor()
        ERC721("Compliant Lot", "cLOT")
        EIP712("CompliantLot", "1")
        Ownable(msg.sender)
    {}

    /* ------------------------ admin ------------------------- */
    function setMintSigner(address signer) external onlyOwner {
        if (signer == address(0)) revert();
        mintSigner = signer;
        emit MintSignerSet(signer);
    }

    function setKyc(address who, bool allowed) external onlyOwner {
        kyc[who] = allowed;
        emit KycSet(who, allowed);
    }

    function setEnforceKycTransfers(bool enabled) external onlyOwner {
        enforceKycTransfers = enabled;
        emit EnforceKycTransfers(enabled);
    }

    /* -------------------- EIP-712 helpers ------------------- */
    function _hashVoucher(MintVoucher calldata v) internal view returns (bytes32) {
        // 動的stringを含むため keccak(bytes(v.tokenURI)) を使用
        bytes32 TYPEHASH = keccak256(
            "MintVoucher(address to,uint256 tokenId,bytes32 commitRoot,bytes32 vkHash,bytes32 schema,bytes32 periodHash,bytes32 deviceHash,string tokenURI,uint64 deadline,bytes32 nonce)"
        );
        bytes32 structHash = keccak256(
            abi.encode(
                TYPEHASH,
                v.to,
                v.tokenId,
                v.commitRoot,
                v.vkHash,
                v.schema,
                v.periodHash,
                v.deviceHash,
                keccak256(bytes(v.tokenURI)),
                v.deadline,
                v.nonce
            )
        );
        return _hashTypedDataV4(structHash);
    }

    /* -------------------------- mint ------------------------ */
    function mintWithVoucher(
        MintVoucher calldata v,
        bytes calldata signature
    ) external returns (uint256 tokenId) {
        if (mintSigner == address(0)) revert SignerNotSet();
        if (block.timestamp > v.deadline) revert VoucherExpired();
        if (usedNonce[v.nonce]) revert NonceUsed();
        if (usedCommitRoot[v.commitRoot]) revert CommitRootUsed();
        if (_ownerOf(v.tokenId) != address(0)) revert TokenExists();

        bytes32 digest = _hashVoucher(v);
        address recovered = ECDSA.recover(digest, signature);
        if (recovered != mintSigner) revert InvalidSigner();

        usedNonce[v.nonce] = true;
        usedCommitRoot[v.commitRoot] = true;

        _safeMint(v.to, v.tokenId);
        if (bytes(v.tokenURI).length != 0) {
            _tokenURIs[v.tokenId] = v.tokenURI;
        }
        proofOf[v.tokenId] = ProofMeta({
            commitRoot: v.commitRoot,
            vkHash:     v.vkHash,
            schema:     v.schema,
            periodHash: v.periodHash,
            deviceHash: v.deviceHash,
            mintedAt:   uint64(block.timestamp),
            revoked:    false
        });

        emit Minted(v.tokenId, v.to, v.commitRoot, v.schema);
        return v.tokenId;
    }

    /* ------------------------ lifecycle --------------------- */
    function revoke(uint256 tokenId, string calldata reason) external onlyOwner {
        if (_ownerOf(tokenId) == address(0)) revert NoToken();
        proofOf[tokenId].revoked = true;
        emit Revoked(tokenId, reason);
    }

    function appendClaim(uint256 tokenId, bytes32 claimHash, string calldata note) external onlyOwner {
        if (_ownerOf(tokenId) == address(0)) revert NoToken();
        emit ClaimAppended(tokenId, claimHash, note);
    }

    function isRevoked(uint256 tokenId) external view returns (bool) {
        return proofOf[tokenId].revoked;
    }

    /* --------------------- tokenURI (slim) ------------------ */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert NoToken();
        return _tokenURIs[tokenId];
    }

    /* ---------------- transfer hook (v5) -------------------- */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId); // 0=ミント, to=0=バーン, 両方≠0=転送

        // 通常転送時のみ制限
        if (from != address(0) && to != address(0)) {
            if (proofOf[tokenId].revoked) revert RevokedLot();
            if (enforceKycTransfers) {
                if (!kyc[from]) revert FromNotKYC();
                if (!kyc[to])   revert ToNotKYC();
            }
        } else if (to != address(0) && enforceKycTransfers) {
            // ミント時にもKYCを強制したい場合（任意）
            if (!kyc[to]) revert ToNotKYC();
        }

        address prevOwner = super._update(to, tokenId, auth);

        // burn時はメタ/URIを削除（commitRootの再利用は不可のまま）
        if (to == address(0)) {
            delete proofOf[tokenId];
            delete _tokenURIs[tokenId];
        }

        return prevOwner;
    }
}