-- GitHub accounts used to skip email verification instead of being marked
-- verified. Their address came from GitHub's verified primary email.
UPDATE `user` SET `email_verified` = 1 WHERE `github_id` IS NOT NULL;
