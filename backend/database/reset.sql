-- Drops the database if exists and re-creates it
DROP DATABASE IF EXISTS edutrack_db;
CREATE DATABASE edutrack_db;
USE edutrack_db;

-- Source the schema
SOURCE schema.sql;

-- Source the seed data
SOURCE seed.sql;
