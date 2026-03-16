using Microsoft.EntityFrameworkCore;
using StewartAI.Domain.Entities;

namespace StewartAI.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<DocumentAnalysis> DocumentAnalyses => Set<DocumentAnalysis>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ConversationMessage> ConversationMessages => Set<ConversationMessage>();
    public DbSet<KnowledgeChunk> KnowledgeChunks => Set<KnowledgeChunk>();
    public DbSet<RiskRecord> RiskRecords => Set<RiskRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ConversationMessage>()
            .HasOne(m => m.Conversation)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DocumentAnalysis>()
            .HasIndex(d => d.AnalyzedAt);

        modelBuilder.Entity<RiskRecord>()
            .HasIndex(r => r.StateCode);

        modelBuilder.Entity<KnowledgeChunk>()
            .HasIndex(k => k.DocumentName);
    }
}
