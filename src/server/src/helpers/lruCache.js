/**
 * LRUCache that can be used to cache objects, mainly used
 * to reduce the interaction with DB.
 */

/* eslint-disable no-plusplus */
/* eslint-disable max-classes-per-file */
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
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.map = {};
    this.currentSize = 0;
    this.head = null;
    this.tail = null;
  }

  set(key, value) {
    const node = this.map[key];
    if (!node) {
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
        logger.info(`deleting lru element ${lruNode.key}`);
        delete this.map[lruNode.key];
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
      logger.info(`cached email id ${key}`);
    }
  }

  get(key) {
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
    logger.info(`Getting value for ${key} from lrucache`);
    return node ? node.val : node;
  }
}

module.exports = LruCache;
