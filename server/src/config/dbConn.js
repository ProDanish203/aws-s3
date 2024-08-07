import mongoose from "mongoose";

export const connDb = async () => {
  try {
    const conn = await mongoose.connect(`${process.env.MONGO_URI}`);
    console.log(`Database Connected Successfully: ${conn.connection.host}`);
  } catch (e) {
    console.log("Database Connection Error: \n", e);
  }
};
