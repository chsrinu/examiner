/* eslint-disable no-undef */
/* eslint-disable global-require */
require('../../../globals/fileImportWrapper');

jest.mock('redis', () => require('redis-mock'));
const LruCache = include('server/src/helpers/lruCache');

let cache;

const user1 = {
  email: 'test1@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

const user2 = {
  email: 'test2@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

const user3 = {
  email: 'test3@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

const user4 = {
  email: 'test4@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

const user5 = {
  email: 'test5@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

const user6 = {
  email: 'test6@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

beforeEach(() => {
  cache = new LruCache(5);
});

describe('LruCache test suite', () => {
  describe('Set and get methods', () => {
    it('By caching a new user in Cache', () => {
      cache.set(user1.email, user1);
      const cachedUser = cache.get(user1.email);
      expect(cachedUser).toEqual(user1);
    });
    it('By fetching a user from empty cache', () => {
      const cachedUser = cache.get(user1.email);
      expect(cachedUser).toBeUndefined();
    });
    it('By populating the cache to its full capacity and pop LRU', () => {
      expect(cache.maxSize).toBe(5);
      expect(cache.currentSize).toBe(0);
      cache.set(user1.email, user1);
      cache.set(user2.email, user2);
      cache.set(user3.email, user3);
      cache.set(user4.email, user4);
      cache.set(user5.email, user5);
      cache.set(user6.email, user6);
      expect(cache.currentSize).toBe(5);
      expect(cache.get(user1.email)).toBeUndefined();
      expect(cache.get(user3.email)).toEqual(user3);
      expect(cache.get(user2.email)).toEqual(user2);
    });
    it('By caching the same user multiple times', () => {
      expect(cache.currentSize).toBe(0);
      cache.set(user1.email, user1);
      cache.set(user1.email, user1);
      cache.set(user1.email, user1);
      cache.set(user1.email, user1);
      expect(cache.currentSize).toBe(1);
    });
    it('When cache size is one', () => {
      cache = new LruCache(1);
      cache.set(user1.email, user1);
      cache.set(user2.email, user2);
      expect(cache.currentSize).toBe(1);
      expect(cache.get(user1.email)).toBeUndefined();
      expect(cache.get(user2.email)).toEqual(user2);
    });
  });
});
