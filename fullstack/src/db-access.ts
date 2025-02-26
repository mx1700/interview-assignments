import {Pool} from 'mysql';
import crypto from 'crypto';

/**
 * 数据访问
 */
export class DbAccess {
  private pool: Pool;

  constructor(connectionPool: Pool) {
    this.pool = connectionPool;
  }

  async getUrlById(id: number): Promise<string | null> {
    const results = await this.query<Array<{ url: string }>>('SELECT url FROM short_url_info WHERE id = ?', [id]);
    return results.length === 0 ? null : results[0].url;
  }

  async getIdByUrl(url: string): Promise<number | null> {
    //hash 为了加快查询速度
    const hash = this.getUrlHash(url);
    const results = await this.query<Array<{ id: number }>>('SELECT id FROM short_url_info WHERE url_hash = ? and url = ?', [hash, url]);
    return results.length === 0 ? null : results[0].id;
  }

  async save(url: string): Promise<number> {
    const hash = this.getUrlHash(url);
    const result = await this.query<{ insertId: number }>('INSERT INTO short_url_info (url, url_hash) VALUES (?, ?)', [url, hash])
    return result.insertId;
  }

  private getUrlHash(url: string) {
    const md5 = crypto.createHash('md5');
    const hash = md5.update(url).digest();
    return hash;
  }

  private async query<R>(sql: string, values: any[]): Promise<R> {
    return new Promise((resolve, reject) => {
      this.pool.query(sql, values, (err, results) => {
        if (err) {
          return reject(err);
        }
        return resolve(results);
      });
    })
  }
}
