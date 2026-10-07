const express = require('express');
const cookieParser = require('cookie-parser');
const redis = require('redis');
const app = express();
const port = 1337;
const SESSION_COOKIE = 'session';
const REDIS_TTL = process.env.REDIS_TTL || 120;
const flag = process.env.FLAG || "maple{placeholder}";

app.use(express.json());
app.use(cookieParser());


let client = redis.createClient({
    url: "redis://redis:6379",
    socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3000) }
});

client.on('error', (err) => console.log('Redis Client Error', err));

client.on('ready', async () => {
    console.log("[Redis cli] Succesfully connected to Redis server.");
    try {
        await client.set("flag", flag);
    } catch (e) {
        console.log(`[ERROR] setting flag: ${e}\n`);
    }
});

client.connect().catch((err) => console.log('Redis Client Connect Error', err));


async function get_wish(username) {
    const wish = await client.get(username);
    if (!wish || username == "flag") return null;
    return JSON.parse(wish);
}

async function set_wish(wish, username) {
    const full_wish = {
        created_at: new Date().toISOString()
    };

    if (typeof full_wish[username] != 'object' || full_wish[username] === null) {
        full_wish[username] = {};
    }

    for (let k in wish) {
        full_wish[username][k] = wish[k];
    }

    const write_options = { EX: REDIS_TTL };
    const res = await client.set(username, JSON.stringify(full_wish), write_options);
    return res;
}

app.use(async (req, _, next) => {
    req.wish = null;
    const username = req.cookies[SESSION_COOKIE];
    if (username) {
        try {
            req.wish = await get_wish(username);
        } catch (e) {
            console.log(`[ERROR] loading session for ${username}: ${e}\n`);
        }
    }
    return next();
});

app.post('/new-wish', async (req, res) => {
    try {
        const username = req.body.username;
        if (typeof username != 'string' || !username) {
            return res.status(400).send("Bad request");
        }
        const wish_result = await set_wish(req.body.wish, username);
        res.cookie(SESSION_COOKIE, username, {
            httpOnly: true,
            sameSite: 'Strict',
            maxAge: REDIS_TTL * 1000
        });
        return res.status(200).send(wish_result);
    } catch (e) {
        console.log(`[ERROR] in /new-wish: ${e}\n`);
        return res.status(400).send("Bad request");
    }
});


app.listen(port, () => {
    console.log(`[ *** ${new Date()} *** ] Listening on port ${port}`);
});
