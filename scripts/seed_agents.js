"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fs_1 = __importDefault(require("node:fs"));
var node_path_1 = __importDefault(require("node:path"));
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var home = process.env.HOME || process.env.USERPROFILE || "";
function resolveAgentsRoot() {
    // Prefer an explicit env var, then in-repo locations, then Desktop fallback.
    var envDir = (process.env.TAPTAP_AGENTS_DIR || "").trim();
    var repoDir = node_path_1.default.join(process.cwd(), "app", "agents");
    var repoNested = node_path_1.default.join(repoDir, "TapTap_AI_Agents");
    var desktopDir = node_path_1.default.join(home, "Desktop", "TapTap_AI_Agents");
    var candidates = [
        envDir && node_path_1.default.resolve(envDir),
        repoDir,
        repoNested,
        desktopDir,
    ].filter(Boolean);
    // First, pick the first candidate that both exists and contains a manifest
    for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
        var c = candidates_1[_i];
        try {
            if (c && node_fs_1.default.existsSync(c) && node_fs_1.default.existsSync(node_path_1.default.join(c, "agents.manifest.json"))) {
                return c;
            }
        }
        catch (_a) { }
    }
    // Otherwise, fall back to the first existing directory among candidates
    for (var _b = 0, candidates_2 = candidates; _b < candidates_2.length; _b++) {
        var c = candidates_2[_b];
        try {
            if (c && node_fs_1.default.existsSync(c))
                return c;
        }
        catch (_c) { }
    }
    // Last resort: default to repo app/agents
    return repoDir;
}
var ROOT = resolveAgentsRoot();
var MANIFEST = node_path_1.default.join(ROOT, "agents.manifest.json");
var PROMPTS_DIR = node_path_1.default.join(ROOT, "prompts");
var WF_DIR = node_path_1.default.join(ROOT, "workflows");
var LOG_DIR = node_path_1.default.join(process.cwd(), "scripts", "logs");
function ensureDir(p) {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        if (!node_fs_1.default.existsSync(p))
            node_fs_1.default.mkdirSync(p, { recursive: true });
        return [2 /*return*/];
    }); });
}
function upsertAgent(a) {
    return __awaiter(this, void 0, void 0, function () {
        var combinedMeta, agent, toArr, datasets, p, body;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        return __generator(this, function (_r) {
            switch (_r.label) {
                case 0:
                    combinedMeta = __assign(__assign({}, ((_a = a.meta) !== null && _a !== void 0 ? _a : {})), (a.theme ? { theme: a.theme } : {}));
                    return [4 /*yield*/, prisma.agent.upsert({
                            where: { name: a.name },
                            create: {
                                name: a.name, role: (_b = a.role) !== null && _b !== void 0 ? _b : "", tone: a.tone, vibe: a.vibe, signature: a.signature, summary: a.summary,
                                version: (_c = a.version) !== null && _c !== void 0 ? _c : "2.0.0", meta: combinedMeta, changelog: (_d = a.changelog) !== null && _d !== void 0 ? _d : [],
                            },
                            update: {
                                role: (_e = a.role) !== null && _e !== void 0 ? _e : "", tone: a.tone, vibe: a.vibe, signature: a.signature, summary: a.summary,
                                version: "2.0.0", meta: combinedMeta, changelog: (_f = a.changelog) !== null && _f !== void 0 ? _f : [],
                            },
                        })];
                case 1:
                    agent = _r.sent();
                    return [4 /*yield*/, prisma.agentTool.deleteMany({ where: { agentId: agent.id } })];
                case 2:
                    _r.sent();
                    return [4 /*yield*/, prisma.agentDataset.deleteMany({ where: { agentId: agent.id } })];
                case 3:
                    _r.sent();
                    return [4 /*yield*/, prisma.agentPlaybook.deleteMany({ where: { agentId: agent.id } })];
                case 4:
                    _r.sent();
                    return [4 /*yield*/, prisma.agentGuardrail.deleteMany({ where: { agentId: agent.id } })];
                case 5:
                    _r.sent();
                    return [4 /*yield*/, prisma.agentHandoff.deleteMany({ where: { agentId: agent.id } })];
                case 6:
                    _r.sent();
                    return [4 /*yield*/, prisma.agentKPI.deleteMany({ where: { agentId: agent.id } })];
                case 7:
                    _r.sent();
                    return [4 /*yield*/, prisma.agentEval.deleteMany({ where: { agentId: agent.id } })];
                case 8:
                    _r.sent();
                    toArr = function (x) { return (x !== null && x !== void 0 ? x : []).filter(Boolean); };
                    datasets = __spreadArray(__spreadArray([], toArr(a.datasources), true), toArr(a.datasets), true);
                    return [4 /*yield*/, prisma.$transaction(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], toArr(a.tools).map(function (name) { return prisma.agentTool.create({ data: { agentId: agent.id, name: name } }); }), true), datasets.map(function (key) { return prisma.agentDataset.create({ data: { agentId: agent.id, key: key } }); }), true), toArr(a.playbooks).map(function (name) { return prisma.agentPlaybook.create({ data: { agentId: agent.id, name: name } }); }), true), toArr(a.guardrails).map(function (rule) { return prisma.agentGuardrail.create({ data: { agentId: agent.id, rule: rule } }); }), true), toArr(a.handoffs).map(function (toName) { return prisma.agentHandoff.create({ data: { agentId: agent.id, toName: toName } }); }), true), Object.entries((_g = a.kpis) !== null && _g !== void 0 ? _g : {}).map(function (_a) {
                            var key = _a[0], target = _a[1];
                            return prisma.agentKPI.create({ data: { agentId: agent.id, key: key, target: String(target) } });
                        }), true), toArr(a.evals).map(function (name) { return prisma.agentEval.create({ data: { agentId: agent.id, name: name } }); }), true))];
                case 9:
                    _r.sent();
                    if (!a.cadence) return [3 /*break*/, 11];
                    return [4 /*yield*/, prisma.agentCadence.upsert({
                            where: { agentId: agent.id },
                            create: { agentId: agent.id, config: a.cadence },
                            update: { config: a.cadence },
                        })];
                case 10:
                    _r.sent();
                    return [3 /*break*/, 13];
                case 11: return [4 /*yield*/, prisma.agentCadence.deleteMany({ where: { agentId: agent.id } })];
                case 12:
                    _r.sent();
                    _r.label = 13;
                case 13:
                    if (!a.ab_test) return [3 /*break*/, 15];
                    return [4 /*yield*/, prisma.agentABTest.upsert({
                            where: { agentId: agent.id },
                            create: {
                                agentId: agent.id,
                                enabled: !!a.ab_test.enabled,
                                variants: (_h = a.ab_test.variants) !== null && _h !== void 0 ? _h : [],
                                sample: (_j = a.ab_test.sample) !== null && _j !== void 0 ? _j : 0,
                                metrics: (_k = a.ab_test.metrics) !== null && _k !== void 0 ? _k : [],
                                logPath: (_l = a.ab_test.log) !== null && _l !== void 0 ? _l : null,
                            },
                            update: {
                                enabled: !!a.ab_test.enabled,
                                variants: (_m = a.ab_test.variants) !== null && _m !== void 0 ? _m : [],
                                sample: (_o = a.ab_test.sample) !== null && _o !== void 0 ? _o : 0,
                                metrics: (_p = a.ab_test.metrics) !== null && _p !== void 0 ? _p : [],
                                logPath: (_q = a.ab_test.log) !== null && _q !== void 0 ? _q : null,
                            },
                        })];
                case 14:
                    _r.sent();
                    return [3 /*break*/, 17];
                case 15: return [4 /*yield*/, prisma.agentABTest.deleteMany({ where: { agentId: agent.id } })];
                case 16:
                    _r.sent();
                    _r.label = 17;
                case 17:
                    p = node_path_1.default.join(PROMPTS_DIR, "".concat(a.name, ".prompt.txt"));
                    if (!node_fs_1.default.existsSync(p)) return [3 /*break*/, 19];
                    body = node_fs_1.default.readFileSync(p, "utf8");
                    return [4 /*yield*/, prisma.agentPrompt.upsert({
                            where: { agentId: agent.id },
                            create: { agentId: agent.id, body: body },
                            update: { body: body },
                        })];
                case 18:
                    _r.sent();
                    _r.label = 19;
                case 19: return [2 /*return*/, agent.name];
            }
        });
    });
}
function upsertWorkflows() {
    return __awaiter(this, void 0, void 0, function () {
        var files, count, _loop_1, _i, files_1, f;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!node_fs_1.default.existsSync(WF_DIR))
                        return [2 /*return*/, 0];
                    files = node_fs_1.default.readdirSync(WF_DIR).filter(function (f) { return f.endsWith(".json"); });
                    count = 0;
                    _loop_1 = function (f) {
                        var p, raw, wf, steps;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    p = node_path_1.default.join(WF_DIR, f);
                                    raw = JSON.parse(node_fs_1.default.readFileSync(p, "utf8"));
                                    return [4 /*yield*/, prisma.workflow.upsert({
                                            where: { name: raw.name },
                                            create: { name: raw.name },
                                            update: {},
                                        })];
                                case 1:
                                    wf = _c.sent();
                                    return [4 /*yield*/, prisma.workflowStep.deleteMany({ where: { workflowId: wf.id } })];
                                case 2:
                                    _c.sent();
                                    steps = ((_a = raw.steps) !== null && _a !== void 0 ? _a : []).map(function (s, i) {
                                        var _a, _b;
                                        return ({
                                            workflowId: wf.id,
                                            order: i,
                                            agentName: s.agent,
                                            action: s.action,
                                            inputs: (_a = s.inputs) !== null && _a !== void 0 ? _a : null,
                                            outputs: (_b = s.outputs) !== null && _b !== void 0 ? _b : null,
                                        });
                                    });
                                    if (!steps.length) return [3 /*break*/, 4];
                                    return [4 /*yield*/, prisma.workflowStep.createMany({ data: steps })];
                                case 3:
                                    _c.sent();
                                    _c.label = 4;
                                case 4:
                                    count++;
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, files_1 = files;
                    _b.label = 1;
                case 1:
                    if (!(_i < files_1.length)) return [3 /*break*/, 4];
                    f = files_1[_i];
                    return [5 /*yield**/, _loop_1(f)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, count];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var list, names, _i, list_1, a, _a, _b, wfCount;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, ensureDir(LOG_DIR)];
                case 1:
                    _c.sent();
                    if (!node_fs_1.default.existsSync(MANIFEST))
                        throw new Error("Missing manifest: ".concat(MANIFEST));
                    list = JSON.parse(node_fs_1.default.readFileSync(MANIFEST, "utf8"));
                    names = [];
                    _i = 0, list_1 = list;
                    _c.label = 2;
                case 2:
                    if (!(_i < list_1.length)) return [3 /*break*/, 5];
                    a = list_1[_i];
                    _b = (_a = names).push;
                    return [4 /*yield*/, upsertAgent(a)];
                case 3:
                    _b.apply(_a, [_c.sent()]);
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, upsertWorkflows()];
                case 6:
                    wfCount = _c.sent();
                    node_fs_1.default.writeFileSync(node_path_1.default.join(LOG_DIR, "seed_agents_".concat(Date.now(), ".log")), JSON.stringify({ root: ROOT, agents: { count: names.length, names: names }, workflows: { count: wfCount } }, null, 2));
                    console.log("Seeded ".concat(names.length, " agents from ").concat(ROOT, ". Imported ").concat(wfCount, " workflows."));
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (e) { console.error(e); process.exit(1); }).finally(function () { return prisma.$disconnect(); });
