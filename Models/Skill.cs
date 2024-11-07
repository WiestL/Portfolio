namespace ProjectPortfolio.Models
{
    public class Skill
    {
        public int SkillId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        // Navigation Properties
        public ICollection<ProjectSkill>? ProjectSkills { get; set; }
    }
}
