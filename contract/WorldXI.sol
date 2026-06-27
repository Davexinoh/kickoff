// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WorldXI
 * @notice Onchain fantasy football registry for World Cup 2026
 * @dev Deployed on X Layer testnet (Chain ID: 195)
 */
contract WorldXI {

    /* ─── STATE ─────────────────────────────────────────────── */

    address public admin;

    struct Manager {
        string  username;
        uint256 registeredAt;
        bool    exists;
    }

    struct SquadEntry {
        string  squadHash;   // keccak256 of sorted player IDs
        uint8   matchday;
        uint256 submittedAt;
        bool    exists;
    }

    struct MatchdayPoints {
        uint16  points;
        uint256 recordedAt;
        bool    exists;
    }

    // wallet → Manager
    mapping(address => Manager) public managers;

    // wallet → matchday → SquadEntry
    mapping(address => mapping(uint8 => SquadEntry)) public squads;

    // wallet → matchday → MatchdayPoints
    mapping(address => mapping(uint8 => MatchdayPoints)) public points;

    // username → wallet (for uniqueness check)
    mapping(string => address) private usernameToWallet;

    // wallet → total points across all matchdays
    mapping(address => uint256) public totalPoints;

    // All registered manager addresses (for leaderboard)
    address[] public managerList;

    /* ─── EVENTS ─────────────────────────────────────────────── */

    event ManagerRegistered(address indexed wallet, string username, uint256 timestamp);
    event SquadSubmitted(address indexed wallet, uint8 matchday, string squadHash, uint256 timestamp);
    event PointsRecorded(address indexed wallet, uint8 matchday, uint16 points, uint256 timestamp);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    /* ─── ERRORS ─────────────────────────────────────────────── */

    error AlreadyRegistered();
    error UsernameTaken();
    error UsernameInvalid();
    error NotRegistered();
    error SquadAlreadySubmitted();
    error MatchdayLocked();
    error NotAdmin();
    error InvalidPoints();

    /* ─── MODIFIERS ──────────────────────────────────────────── */

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier onlyRegistered() {
        if (!managers[msg.sender].exists) revert NotRegistered();
        _;
    }

    /* ─── CONSTRUCTOR ────────────────────────────────────────── */

    constructor() {
        admin = msg.sender;
    }

    /* ─── MANAGER REGISTRATION ───────────────────────────────── */

    /**
     * @notice Register a manager username — one time per wallet, permanent
     * @param username 3–20 chars, alphanumeric + underscore only
     */
    function registerManager(string calldata username) external {
        if (managers[msg.sender].exists) revert AlreadyRegistered();
        if (usernameToWallet[username] != address(0)) revert UsernameTaken();

        bytes memory u = bytes(username);
        if (u.length < 3 || u.length > 20) revert UsernameInvalid();

        // Validate characters: a-z, A-Z, 0-9, underscore
        for (uint i = 0; i < u.length; i++) {
            bytes1 c = u[i];
            bool valid = (c >= 0x61 && c <= 0x7A) || // a-z
                         (c >= 0x41 && c <= 0x5A) || // A-Z
                         (c >= 0x30 && c <= 0x39) || // 0-9
                         (c == 0x5F);                 // _
            if (!valid) revert UsernameInvalid();
        }

        managers[msg.sender] = Manager({
            username:      username,
            registeredAt:  block.timestamp,
            exists:        true
        });

        usernameToWallet[username] = msg.sender;
        managerList.push(msg.sender);

        emit ManagerRegistered(msg.sender, username, block.timestamp);
    }

    /* ─── SQUAD SUBMISSION ───────────────────────────────────── */

    /**
     * @notice Submit squad for a matchday — one per matchday per wallet
     * @param matchday  Matchday number (1–64)
     * @param squadHash Hash of the squad selection (generated on frontend)
     */
    function submitSquad(uint8 matchday, string calldata squadHash) external onlyRegistered {
        if (squads[msg.sender][matchday].exists) revert SquadAlreadySubmitted();

        squads[msg.sender][matchday] = SquadEntry({
            squadHash:   squadHash,
            matchday:    matchday,
            submittedAt: block.timestamp,
            exists:      true
        });

        emit SquadSubmitted(msg.sender, matchday, squadHash, block.timestamp);
    }

    /* ─── POINTS RECORDING (admin only) ─────────────────────── */

    /**
     * @notice Record points for a manager after matchday ends
     * @param manager  Wallet address of the manager
     * @param matchday Matchday number
     * @param pts      Points scored
     */
    function recordPoints(
        address manager,
        uint8   matchday,
        uint16  pts
    ) external onlyAdmin {
        if (!managers[manager].exists) revert NotRegistered();
        if (pts > 500) revert InvalidPoints(); // sanity cap

        points[manager][matchday] = MatchdayPoints({
            points:     pts,
            recordedAt: block.timestamp,
            exists:     true
        });

        totalPoints[manager] += pts;

        emit PointsRecorded(manager, matchday, pts, block.timestamp);
    }

    /**
     * @notice Batch record points for multiple managers at once
     */
    function recordPointsBatch(
        address[] calldata managers_,
        uint8     matchday,
        uint16[]  calldata pts
    ) external onlyAdmin {
        require(managers_.length == pts.length, "Length mismatch");
        for (uint i = 0; i < managers_.length; i++) {
            if (!managers[managers_[i]].exists) continue;
            if (pts[i] > 500) continue;

            points[managers_[i]][matchday] = MatchdayPoints({
                points:     pts[i],
                recordedAt: block.timestamp,
                exists:     true
            });

            totalPoints[managers_[i]] += pts[i];

            emit PointsRecorded(managers_[i], matchday, pts[i], block.timestamp);
        }
    }

    /* ─── VIEWS ──────────────────────────────────────────────── */

    function getManager(address wallet) external view returns (
        string memory username,
        uint256 registeredAt,
        uint256 total,
        bool exists
    ) {
        Manager memory m = managers[wallet];
        return (m.username, m.registeredAt, totalPoints[wallet], m.exists);
    }

    function getSquad(address wallet, uint8 matchday) external view returns (
        string memory squadHash,
        uint256 submittedAt,
        bool exists
    ) {
        SquadEntry memory s = squads[wallet][matchday];
        return (s.squadHash, s.submittedAt, s.exists);
    }

    function getPoints(address wallet, uint8 matchday) external view returns (
        uint16 pts,
        uint256 recordedAt,
        bool exists
    ) {
        MatchdayPoints memory p = points[wallet][matchday];
        return (p.points, p.recordedAt, p.exists);
    }

    function getManagerCount() external view returns (uint256) {
        return managerList.length;
    }

    function isUsernameAvailable(string calldata username) external view returns (bool) {
        return usernameToWallet[username] == address(0);
    }

    /* ─── ADMIN ──────────────────────────────────────────────── */

    function transferAdmin(address newAdmin) external onlyAdmin {
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }
}
