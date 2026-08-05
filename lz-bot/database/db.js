const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const DB_PATH = path.resolve(config.dbPath);

// ─────────────────────────────────────────────
//  Default schema for new records
// ─────────────────────────────────────────────
const defaultUser = () => ({
  id: '',
  name: '',
  age: 0,
  coins: config.startCoins,
  xp: config.startXP,
  level: 1,
  premium: false,
  banned: false,
  warns: 0,
  registeredAt: new Date().toISOString(),
  lastDaily: null,
  lastWeekly: null,
  lastWork: null,
  lastMine: null,
  lastHunt: null,
  inventory: [],
  boosts: {},
  totalMessages: 0,
  totalCommands: 0
});

const defaultGroup = () => ({
  id: '',
  antiLink: false,
  antiBot: false,
  antiArab: false,
  antiSpam: false,
  antiLongText: false,
  antiSticker: false,
  antiDelete: false,
  antiFake: false,
  antiLinkGc: false,
  welcome: false,
  goodbye: false,
  welcomeMsg: '',
  goodbyeMsg: '',
  autoReact: false,
  autoSticker: false,
  autoTranslate: false,
  autoAI: false,
  muted: false,
  warns: {},
  mutedUsers: {},
  open: true,
  prefix: config.prefix
});

const defaultSettings = () => ({
  prefix: config.prefix,
  language: config.language,
  autoRead: false,
  autoTyping: false,
  autoRecord: false,
  autoStatus: false,
  mode: 'public', // public | group | private
  owners: [],
  bannedUsers: [],
  blacklist: [],
  whitelist: []
});

// ─────────────────────────────────────────────
//  Database class (JSON-based, no external dep)
// ─────────────────────────────────────────────
class Database {
  constructor() {
    this._ensureFile();
    this.data = this._load();
  }

  _ensureFile() {
    fs.ensureDirSync(path.dirname(DB_PATH));
    if (!fs.existsSync(DB_PATH)) {
      fs.writeJsonSync(DB_PATH, { users: {}, groups: {}, settings: defaultSettings() }, { spaces: 2 });
    }
  }

  _load() {
    try {
      return fs.readJsonSync(DB_PATH);
    } catch {
      return { users: {}, groups: {}, settings: defaultSettings() };
    }
  }

  save() {
    fs.writeJsonSync(DB_PATH, this.data, { spaces: 2 });
  }

  // ── Users ────────────────────────────────────
  getUser(id) {
    if (!this.data.users[id]) return null;
    return this.data.users[id];
  }

  createUser(id, name = '', age = 0) {
    if (this.data.users[id]) return false;
    const user = defaultUser();
    user.id = id;
    user.name = name;
    user.age = age;
    this.data.users[id] = user;
    this.save();
    return true;
  }

  updateUser(id, fields) {
    if (!this.data.users[id]) return false;
    Object.assign(this.data.users[id], fields);
    this.save();
    return true;
  }

  addCoins(id, amount) {
    if (!this.data.users[id]) return false;
    this.data.users[id].coins = Math.max(0, (this.data.users[id].coins || 0) + amount);
    this.save();
    return this.data.users[id].coins;
  }

  addXP(id, amount) {
    if (!this.data.users[id]) return false;
    this.data.users[id].xp = (this.data.users[id].xp || 0) + amount;
    const { level, leveled } = this._calcLevel(id);
    this.save();
    return { xp: this.data.users[id].xp, level, leveled };
  }

  _calcLevel(id) {
    const user = this.data.users[id];
    if (!user) return { level: 1, leveled: false };
    const oldLevel = user.level || 1;
    const needed = oldLevel * config.levelMultiplier;
    let leveled = false;
    if (user.xp >= needed) {
      user.xp -= needed;
      user.level = oldLevel + 1;
      leveled = true;
      // Give level reward coins if configured
      const reward = config.levelRewards[user.level];
      if (reward) user.coins = (user.coins || 0) + reward.coins;
    }
    return { level: user.level, leveled };
  }

  getAllUsers() {
    return Object.values(this.data.users);
  }

  deleteUser(id) {
    delete this.data.users[id];
    this.save();
  }

  // ── Groups ───────────────────────────────────
  getGroup(id) {
    if (!this.data.groups[id]) {
      const g = defaultGroup();
      g.id = id;
      this.data.groups[id] = g;
      this.save();
    }
    return this.data.groups[id];
  }

  updateGroup(id, fields) {
    if (!this.data.groups[id]) this.getGroup(id);
    Object.assign(this.data.groups[id], fields);
    this.save();
    return true;
  }

  getAllGroups() {
    return Object.values(this.data.groups);
  }

  // ── Settings (global bot config) ────────────
  getSettings() {
    return this.data.settings;
  }

  updateSettings(fields) {
    Object.assign(this.data.settings, fields);
    this.save();
  }

  addOwner(number) {
    if (!this.data.settings.owners.includes(number)) {
      this.data.settings.owners.push(number);
      this.save();
    }
  }

  removeOwner(number) {
    this.data.settings.owners = this.data.settings.owners.filter(n => n !== number);
    this.save();
  }

  isOwner(number) {
    const clean = number.replace(/[^0-9]/g, '').replace('@s.whatsapp.net', '');
    return (
      clean === config.ownerNumber ||
      this.data.settings.owners.includes(clean)
    );
  }

  banUser(id) {
    if (this.data.users[id]) this.data.users[id].banned = true;
    if (!this.data.settings.bannedUsers.includes(id)) this.data.settings.bannedUsers.push(id);
    this.save();
  }

  unbanUser(id) {
    if (this.data.users[id]) this.data.users[id].banned = false;
    this.data.settings.bannedUsers = this.data.settings.bannedUsers.filter(u => u !== id);
    this.save();
  }

  isBanned(id) {
    return this.data.settings.bannedUsers.includes(id) || (this.data.users[id] && this.data.users[id].banned);
  }

  // ── Warns ────────────────────────────────────
  addWarn(groupId, userId) {
    const group = this.getGroup(groupId);
    if (!group.warns[userId]) group.warns[userId] = 0;
    group.warns[userId]++;
    this.save();
    return group.warns[userId];
  }

  removeWarn(groupId, userId) {
    const group = this.getGroup(groupId);
    if (group.warns[userId]) {
      group.warns[userId] = Math.max(0, group.warns[userId] - 1);
      this.save();
    }
    return group.warns[userId] || 0;
  }

  getWarns(groupId, userId) {
    const group = this.getGroup(groupId);
    return group.warns[userId] || 0;
  }

  // ── Mutes ────────────────────────────────────
  muteUser(groupId, userId, until) {
    const group = this.getGroup(groupId);
    group.mutedUsers[userId] = until;
    this.save();
  }

  unmuteUser(groupId, userId) {
    const group = this.getGroup(groupId);
    delete group.mutedUsers[userId];
    this.save();
  }

  isMuted(groupId, userId) {
    const group = this.getGroup(groupId);
    const until = group.mutedUsers[userId];
    if (!until) return false;
    if (Date.now() > until) {
      this.unmuteUser(groupId, userId);
      return false;
    }
    return true;
  }
}

module.exports = new Database();
