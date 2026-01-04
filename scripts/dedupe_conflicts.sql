-- Safe dedupe for TapTap ZION
-- Keep the lowest id per unique key and delete the rest

-- 1) Follow(followerId, followingId)
WITH d AS (
  SELECT "followerId", "followingId", MIN("id") AS keep_id
  FROM "Follow"
  GROUP BY "followerId", "followingId"
  HAVING COUNT(*) > 1
)
DELETE FROM "Follow" f
USING d
WHERE f."followerId" = d."followerId"
  AND f."followingId" = d."followingId"
  AND f."id" <> d.keep_id;

-- 2) User(username)
WITH d AS (
  SELECT "username", MIN("id") AS keep_id
  FROM "User"
  GROUP BY "username"
  HAVING COUNT(*) > 1
)
DELETE FROM "User" u
USING d
WHERE u."username" = d."username"
  AND u."id" <> d.keep_id;

-- 3) User(authUserId)
WITH d AS (
  SELECT "authUserId", MIN("id") AS keep_id
  FROM "User"
  GROUP BY "authUserId"
  HAVING COUNT(*) > 1
)
DELETE FROM "User" u
USING d
WHERE u."authUserId" = d."authUserId"
  AND u."id" <> d.keep_id;

-- 4) Wallet(address)
WITH d AS (
  SELECT "address", MIN("id") AS keep_id
  FROM "Wallet"
  GROUP BY "address"
  HAVING COUNT(*) > 1
)
DELETE FROM "Wallet" w
USING d
WHERE w."address" = d."address"
  AND w."id" <> d.keep_id;

