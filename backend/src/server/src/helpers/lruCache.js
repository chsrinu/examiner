/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/* eslint-disable no-dupe-class-members */
/**
 * LRUCache that can be used to cache objects, mainly used
 * to reduce the interaction with DB.
 */

/* eslint-disable no-plusplus */
/* eslint-disable max-classes-per-file */
const mongoose = require('mongoose');

const logger = include('server/src/helpers/logger')(__filename);

class Node {
  constructor(key, val) {
    this.prev = null;
    this.key = key;
    this.val = val;
    this.next = null;
  }
}

class LruCache {
  constructor(name, maxSize, altKeyGenerator) {
    this.name = name;
    this.maxSize = maxSize;
    this.map = {};
    this.currentSize = 0;
    this.head = null;
    this.tail = null;
    this.altKeysMap = {};
    this.altKeyGenerator = altKeyGenerator;
  }

  set(key, value) {
    if (this.altKeyGenerator) {
      if (this.isAltKey(key)) {
        if (!this.altKeysMap[key]) this.altKeysMap[key] = value._id;
        key = value._id;
      } else if (!this.altKeysMap[key]) {
        this.altKeysMap[this.altKeyGenerator(value)] = key;
      }
    }
    const node = this.map[key];
    if (!node && key) {
      const newNode = new Node(key, value);
      if (this.currentSize >= this.maxSize) {
        const lruNode = this.tail;
        if (this.head === this.tail) {
          this.head = null;
          this.tail = null;
        } else {
          // left shift the tail pointer
          this.tail = lruNode.prev;
          this.tail.next = null;
        }
        // remove the lru node from dictionary
        logger.info(`${this.name}: deleting lru element ${lruNode.key}`);
        this.deleteEntry(lruNode.key);
      } else {
        this.currentSize++;
      }
      this.map[key] = newNode;
      // make head and tail point to the same node when cache is empty
      if (this.head === null) {
        this.head = newNode;
        this.tail = newNode;
      } else {
        // make new node as head
        this.head.prev = newNode;
        newNode.next = this.head;
        this.head = newNode;
      }
      logger.info(`${this.name}: Cached element with key as ${key}`);
    }
  }

  getKeyFromAltKey(key) {
    return this.altKeysMap[key];
  }

  // eslint-disable-next-line class-methods-use-this
  isAltKey(key) {
    return !mongoose.Types.ObjectId.isValid(key);
  }

  /* We can get the cached values with 2 types of key
  either the key can be an objectId or the key is some
  kind of composite key like an email(for UserCache) and
  examinerEmail_examName(for examCache) these composite keys
  are altKeys which can map to the objectId using the altKeysMap.
  */
  get(key) {
    if (this.isAltKey(key)) key = this.getKeyFromAltKey(key);
    const node = this.map[key];
    if (node) {
      if (node !== this.head) {
        // disconnect both the ends
        node.prev.next = node.next;
        // check whether its a tail node
        if (node.next === null) {
          this.tail = node.prev;
        } else {
          node.next.prev = node.prev;
        }
        // make it as head
        node.prev = null;
        this.head.prev = node;
        node.next = this.head;
        this.head = node;
      }
    }
    logger.info(`${this.name}: Getting value for ${key} from lrucache`);
    return node ? node.val : node;
  }

  updateValue(key, value, oldAltKey) {
    if (this.isAltKey(key)) {
      key = value._id;
    }
    if (this.map[key]) {
      this.map[key].val = value;
      /* Since alt is composed of values from valueData this needs to be updated
      when Value is updated */
      if (oldAltKey) {
        delete this.altKeysMap[oldAltKey];
        if (this.altKeyGenerator) {
          const updatedAltKey = this.altKeyGenerator(value);
          this.altKeysMap[updatedAltKey] = key;
        }
      }
    }
  }

  deleteEntry(key) {
    const nodeObj = this.map[key];
    if (nodeObj) {
      if (this.altKeyGenerator) {
        const altKey = this.altKeyGenerator(nodeObj.val);
        delete this.altKeysMap[altKey];
      }
      delete this.map[key];
    } else {
      logger.info(`${this.name}: Key ${key} not found to delete from cache`);
    }
  }

  clear() {
    this.map = {};
    this.altKeysMap = {};
  }

  size() {
    return this.currentSize;
  }
}

module.exports = LruCache;
