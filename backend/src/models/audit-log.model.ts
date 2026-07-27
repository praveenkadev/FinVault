import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  eventId: string;
  eventType: 'TRANSACTION_CREATED' | 'TRANSACTION_UPDATED' | 'FRAUD_FLAGGED';
  userId: string;
  transactionId: string;
  amount: number;
  status: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: {
      type: String,
      enum: ['TRANSACTION_CREATED', 'TRANSACTION_UPDATED', 'FRAUD_FLAGGED'],
      required: true,
    },
    userId: { type: String, required: true, index: true },
    transactionId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  {
    collection: 'audit_logs',
    timestamps: true,
  }
);

AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ eventType: 1, timestamp: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
