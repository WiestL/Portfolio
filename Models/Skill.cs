namespace ProjectPortfolio.Models
{
    public class Skill
    {
        public int SkillId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }

        // Navigation Properties
        public ICollection<ProjectSkill>? ProjectSkills { get; set; }
    }

}
