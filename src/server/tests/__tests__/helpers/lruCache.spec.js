/* eslint-disable no-undef */
/* eslint-disable global-require */
require('../../../globals/fileImportWrapper');

jest.mock('redis', () => require('redis-mock'));
const LruCache = include('server/src/helpers/lruCache');

let cache;
const useraltKeyGenerator = (value) => value.email;
const user1 = {
  _id: '60b86f40adabb41be14d6fd0',
  email: 'test1@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

const user2 = {
  _id: '60b86f40adabb41be14d6fd1',
  email: 'test2@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

const user3 = {
  _id: '60b86f40adabb41be14d6fd2',
  email: 'test3@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

const user4 = {
  _id: '60b86f40adabb41be14d6fd3',
  email: 'test4@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

const user5 = {
  _id: '60b86f40adabb41be14d6fd4',
  email: 'test5@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

const user6 = {
  _id: '60b86f40adabb41be14d6fd5',
  email: 'test6@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

beforeEach(() => {
  cache = new LruCache(5, useraltKeyGenerator);
});

describe('LruCache test suite', () => {
  describe('Set and get methods', () => {
    it('By caching a new user in Cache', () => {
      cache.set(user1.email, user1);
      const cachedUser = cache.get(user1.email);
      const userbyId = cache.get('60b86f40adabb41be14d6fd0');
      expect(cachedUser).toEqual(user1);
      expect(userbyId).toEqual(cachedUser);
      const altKey = cache.altKeyGenerator(user1);
      expect(altKey).toBe(user1.email);
      const objId = cache.getKeyFromAltKey(altKey);
      expect(objId).toBe('60b86f40adabb41be14d6fd0');
      expect(cache.size()).toBe(1);
      cache.set(user1.email, user1);
      expect(cache.size()).toBe(1);
      expect(Object.keys(cache.altKeysMap).length).toBe(1);
    });
    it('By fetching a user from empty cache', () => {
      cache = new LruCache(1, useraltKeyGenerator);
      const cachedUser = cache.get(user1.email);
      expect(cachedUser).toBeUndefined();
      cache.set(user1.email, user1);
      cache.set(user2.email, user2);
      const cachedUser1 = cache.get(user1.email);
      const cachedUser2 = cache.get('60b86f40adabb41be14d6fd1');
      expect(cachedUser1).toBeUndefined();
      expect(cachedUser2).toEqual(user2);
      expect(Object.keys(cache.altKeysMap).length).toBe(1);
      expect(cache.size()).toBe(1);
    });
    it('detecting altKeys', () => {
      expect(cache.isAltKey('email')).toBeTruthy();
      expect(cache.isAltKey('60b86f40adabb41be14d6fd1')).toBeFalsy();
    });
    it('By populating the cache to its full capacity and pop LRU', () => {
      expect(cache.maxSize).toBe(5);
      expect(cache.size()).toBe(0);
      cache.set(user1.email, user1);
      cache.set(user2.email, user2);
      cache.set(user3.email, user3);
      cache.set(user4.email, user4);
      cache.set(user5.email, user5);
      expect(cache.get('60b86f40adabb41be14d6fd0')).toEqual(user1);
      expect(cache.get('60b86f40adabb41be14d6fd1')).toEqual(user2);
      expect(cache.get('60b86f40adabb41be14d6fd2')).toEqual(user3);
      expect(cache.get('60b86f40adabb41be14d6fd3')).toEqual(user4);
      expect(cache.get('60b86f40adabb41be14d6fd4')).toEqual(user5);
      cache.set(user6.email, user6);
      expect(cache.size()).toBe(5);
      expect(Object.keys(cache.altKeysMap).length).toBe(5);
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
      cache = new LruCache(1, useraltKeyGenerator);
      cache.set(user1.email, user1);
      cache.set(user2.email, user2);
      expect(cache.currentSize).toBe(1);
      expect(cache.get(user1.email)).toBeUndefined();
      expect(cache.get(user2.email)).toEqual(user2);
    });
  });
});
