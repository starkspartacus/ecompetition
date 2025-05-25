import { getDb } from "@/lib/mongodb";
import { ObjectId, type Collection } from "mongodb";

export interface BaseDocument {
  _id?: ObjectId;
  id?: string;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class BaseModel<T extends BaseDocument> {
  protected collectionName: string;
  protected collection?: Collection<T>;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected async getCollection(): Promise<Collection<T>> {
    if (!this.collection) {
      const db = await getDb();
      this.collection = db.collection<T>(this.collectionName);
    }
    return this.collection!;
  }

  protected normalizeDocument(doc: any): T | null {
    if (!doc) return null;

    return {
      ...doc,
      id: doc._id?.toString(),
      _id: doc._id,
    } as T;
  }

  protected normalizeDocuments(docs: any[]): T[] {
    return docs
      .map((doc) => this.normalizeDocument(doc))
      .filter(Boolean) as T[];
  }

  protected prepareForInsert(data: Partial<T>): Omit<T, "_id" | "id"> {
    const now = new Date();
    const { id, _id, ...cleanData } = data as any;

    return {
      ...cleanData,
      createdAt: cleanData.createdAt || now,
      updatedAt: now,
    } as Omit<T, "_id" | "id">;
  }

  protected prepareForUpdate(
    data: Partial<T>
  ): Partial<Omit<T, "_id" | "id" | "createdAt">> {
    const { id, _id, createdAt, ...cleanData } = data as any;

    return {
      ...cleanData,
      updatedAt: new Date(),
    };
  }

  async findById(id: string): Promise<T | null> {
    try {
      if (!ObjectId.isValid(id)) return null;

      const collection = await this.getCollection();
      const doc = await collection.findOne({ _id: new ObjectId(id) } as any);

      return this.normalizeDocument(doc);
    } catch (error) {
      console.error(
        `Erreur lors de la recherche par ID dans ${this.collectionName}:`,
        error
      );
      return null;
    }
  }

  async findOne(filter: any): Promise<T | null> {
    try {
      const collection = await this.getCollection();
      const doc = await collection.findOne(filter);

      return this.normalizeDocument(doc);
    } catch (error) {
      console.error(
        `Erreur lors de la recherche dans ${this.collectionName}:`,
        error
      );
      return null;
    }
  }

  async findMany(filter: any = {}, options: any = {}): Promise<T[]> {
    try {
      const collection = await this.getCollection();
      const cursor = collection.find(filter, options);

      if (options.sort) cursor.sort(options.sort);
      if (options.limit) cursor.limit(options.limit);
      if (options.skip) cursor.skip(options.skip);

      const docs = await cursor.toArray();
      return this.normalizeDocuments(docs);
    } catch (error) {
      console.error(
        `Erreur lors de la recherche multiple dans ${this.collectionName}:`,
        error
      );
      return [];
    }
  }

  async create(data: Partial<T>): Promise<T | null> {
    try {
      const collection = await this.getCollection();
      const insertData = this.prepareForInsert(data);

      const result = await collection.insertOne(insertData as any);

      if (!result.insertedId) return null;

      return this.findById(result.insertedId.toString());
    } catch (error) {
      console.error(
        `Erreur lors de la création dans ${this.collectionName}:`,
        error
      );
      return null;
    }
  }

  async updateById(id: string, data: Partial<T>): Promise<T | null> {
    try {
      if (!ObjectId.isValid(id)) return null;

      const collection = await this.getCollection();
      const updateData = this.prepareForUpdate(data);

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) } as any,
        { $set: updateData as any },
        { returnDocument: "after" }
      );

      return this.normalizeDocument(result);
    } catch (error) {
      console.error(
        `Erreur lors de la mise à jour dans ${this.collectionName}:`,
        error
      );
      return null;
    }
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      if (!ObjectId.isValid(id)) return false;

      const collection = await this.getCollection();
      const result = await collection.deleteOne({
        _id: new ObjectId(id),
      } as any);

      return result.deletedCount === 1;
    } catch (error) {
      console.error(
        `Erreur lors de la suppression dans ${this.collectionName}:`,
        error
      );
      return false;
    }
  }

  async count(filter: any = {}): Promise<number> {
    try {
      const collection = await this.getCollection();
      return await collection.countDocuments(filter);
    } catch (error) {
      console.error(
        `Erreur lors du comptage dans ${this.collectionName}:`,
        error
      );
      return 0;
    }
  }

  async createIndexes(): Promise<void> {
    // À implémenter dans les classes enfants
  }
}
