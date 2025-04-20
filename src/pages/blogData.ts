// Blog post data types
export interface BlogPost {
  title: string;
  slug?: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  category: string;
  content: BlogContent[];
}

export type BlogContent = 
  | { type: 'paragraph'; content: string }
  | { type: 'heading'; content: string }
  | { type: 'list'; items: string[] }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'quote'; content: string }
  | { type: 'recipe'; title: string; intro?: string; ingredients?: string[]; instructions?: string[]; notes?: string };

// Blog posts data
export const blogPosts: BlogPost[] = [
  // First blog post
  {
    title: "Protein-Packed Blueberry Overnight Oats",
    slug: "protein-packed-blueberry-overnight-oats",
    excerpt: "Start your day with this delicious, nutrient-dense breakfast that's perfect for busy mornings. Prep it the night before for a grab-and-go meal that will keep you energized all morning.",
    author: "Jaime",
    date: "March 23, 2025",
    readTime: "5 min read",
    image: "/unsplash-images/blog-1.jpg",
    category: "Nutrition",
    content: [
      {
        type: 'paragraph',
        content: 'Breakfast is often called the most important meal of the day, and for good reason. A nutritious breakfast kickstarts your metabolism, provides essential energy for morning activities, and helps prevent overeating later in the day. However, busy mornings can make it challenging to prepare a balanced meal. That\'s where overnight oats come to the rescue!'
      },
      {
        type: 'paragraph',
        content: 'This protein-packed blueberry overnight oats recipe is not only delicious but also incredibly convenient. By preparing it the night before, you\'ll have a nutrient-dense breakfast ready to grab as you head out the door. The combination of protein, complex carbohydrates, and healthy fats will keep you satisfied and energized throughout your morning.'
      },
      {
        type: 'recipe',
        title: 'Protein-Packed Blueberry Overnight Oats',
        intro: 'This simple, make-ahead breakfast is loaded with protein, fiber, and antioxidants to fuel your busy day.',
        ingredients: [
          '1/2 cup rolled oats',
          '1 scoop (about 25g) vanilla protein powder',
          '1 tablespoon chia seeds',
          '3/4 cup unsweetened almond milk (or milk of choice)',
          '1/4 cup Greek yogurt',
          '1/2 cup fresh or frozen blueberries',
          '1 tablespoon maple syrup or honey (optional)',
          '1/4 teaspoon vanilla extract',
          'Pinch of salt',
          'Optional toppings: additional blueberries, sliced almonds, hemp seeds'
        ],
        instructions: [
          'In a mason jar or container with a lid, combine the rolled oats, protein powder, and chia seeds. Stir to mix well.',
          'Add the almond milk, Greek yogurt, maple syrup (if using), vanilla extract, and salt. Stir until all ingredients are well combined.',
          'Gently fold in the blueberries.',
          'Seal the container and refrigerate overnight or for at least 4 hours.',
          'In the morning, give it a good stir. If the mixture is too thick, add a splash more milk.',
          'Top with additional blueberries and other optional toppings before enjoying.'
        ],
        notes: 'For meal prep, you can make up to 3-4 jars at once and store them in the refrigerator for up to 4 days.'
      },
      {
        type: 'heading',
        content: 'Nutritional Benefits'
      },
      {
        type: 'paragraph',
        content: 'This breakfast powerhouse offers numerous health benefits:'
      },
      {
        type: 'list',
        items: [
          'Protein: The combination of protein powder and Greek yogurt provides approximately 25g of protein per serving, supporting muscle recovery and growth.',
          'Complex Carbohydrates: Rolled oats deliver slow-releasing energy to fuel your morning workouts and activities.',
          'Healthy Fats: Chia seeds contain omega-3 fatty acids, which support heart and brain health.',
          'Antioxidants: Blueberries are packed with antioxidants that help fight inflammation and oxidative stress.',
          'Fiber: With approximately 8g of fiber per serving, this breakfast promotes digestive health and sustained energy levels.'
        ]
      },
      {
        type: 'heading',
        content: 'Customization Options'
      },
      {
        type: 'paragraph',
        content: 'One of the best things about overnight oats is how versatile they are. Here are some ways to customize this recipe:'
      },
      {
        type: 'list',
        items: [
          'Swap blueberries for strawberries, raspberries, or a mix of berries',
          'Add a tablespoon of nut butter for extra protein and healthy fats',
          'Include a sprinkle of cinnamon or nutmeg for warming flavor',
          'Mix in a tablespoon of cocoa powder for a chocolate version',
          'Top with granola for added crunch'
        ]
      },
      {
        type: 'paragraph',
        content: 'This recipe is perfect for anyone with a busy lifestyle who doesn\'t want to compromise on nutrition. It\'s especially beneficial for those who exercise in the morning, as the balanced macronutrient profile provides ideal pre-workout fuel or post-workout recovery nutrition.'
      },
      {
        type: 'quote',
        content: 'Consistency is key in nutrition. Finding healthy breakfast options that you actually enjoy eating is one of the most impactful ways to maintain a nutritious diet long-term.'
      },
      {
        type: 'paragraph',
        content: 'Give this protein-packed blueberry overnight oats recipe a try and start your day with a nutritious, delicious meal that will keep you energized and satisfied. Your body will thank you!'
      }
    ]
  },
  // Second blog post
  {
    title: "5 Essential Compound Exercises for Total-Body Strength",
    slug: "5-essential-compound-exercises-for-total-body-strength",
    excerpt: "Maximize your workout efficiency with these five powerful compound exercises that target multiple muscle groups simultaneously for optimal strength gains.",
    author: "Jaime",
    date: "March 20, 2025",
    readTime: "7 min read",
    image: "/unsplash-images/blog-2.jpg",
    category: "Training",
    content: [
      {
        type: 'paragraph',
        content: 'When it comes to building functional strength and muscle mass efficiently, compound exercises are unmatched. Unlike isolation exercises that target a single muscle group, compound movements engage multiple muscle groups and joints simultaneously, delivering maximum results in minimal time.'
      },
      {
        type: 'paragraph',
        content: 'Whether you\'re a beginner or an experienced lifter, incorporating these five essential compound exercises into your routine will help you build total-body strength, improve coordination, and boost your metabolic rate for enhanced fat burning.'
      },
      {
        type: 'heading',
        content: '1. Barbell Squats: The King of Lower Body Exercises'
      },
      {
        type: 'paragraph',
        content: 'Often called the king of all exercises, the barbell squat is a fundamental movement that primarily targets your quadriceps, hamstrings, and glutes while engaging your core and lower back muscles for stability.'
      },
      {
        type: 'list',
        items: [
          'Primary muscles worked: Quadriceps, hamstrings, glutes',
          'Secondary muscles worked: Core, lower back, calves',
          'Benefits: Increases lower body strength, improves mobility, boosts hormone production, enhances athletic performance'
        ]
      },
      {
        type: 'paragraph',
        content: 'Proper form is crucial for safety and effectiveness. Keep your chest up, back straight, and ensure your knees track in line with your toes. Beginners should master bodyweight squats before progressing to barbell variations.'
      },
      {
        type: 'heading',
        content: '2. Deadlifts: The Ultimate Posterior Chain Developer'
      },
      {
        type: 'paragraph',
        content: 'The deadlift is perhaps the most effective exercise for developing total-body strength, particularly targeting the posterior chain—the muscles along the back of your body.'
      },
      {
        type: 'list',
        items: [
          'Primary muscles worked: Hamstrings, glutes, lower back',
          'Secondary muscles worked: Traps, lats, forearms, core',
          'Benefits: Builds functional strength, improves posture, increases grip strength, enhances power production'
        ]
      },
      {
        type: 'paragraph',
        content: 'Focus on maintaining a neutral spine throughout the movement. Start with lighter weights to perfect your form before challenging yourself with heavier loads. Consider variations like sumo deadlifts or Romanian deadlifts to target slightly different muscle groups.'
      },
      {
        type: 'heading',
        content: '3. Bench Press: Building Upper Body Pushing Strength'
      },
      {
        type: 'paragraph',
        content: 'The bench press is the gold standard for developing upper body pushing strength, primarily targeting the chest, shoulders, and triceps.'
      },
      {
        type: 'list',
        items: [
          'Primary muscles worked: Pectorals (chest), anterior deltoids (front shoulders), triceps',
          'Secondary muscles worked: Core, serratus anterior',
          'Benefits: Builds upper body strength, improves pushing power, develops chest aesthetics'
        ]
      },
      {
        type: 'paragraph',
        content: 'Proper bench press form includes keeping your feet flat on the floor, maintaining a slight arch in your lower back, and keeping your shoulders retracted. Control the weight throughout the entire range of motion for maximum muscle engagement.'
      },
      {
        type: 'heading',
        content: '4. Pull-Ups: The Ultimate Upper Body Pulling Movement'
      },
      {
        type: 'paragraph',
        content: 'Pull-ups are one of the most challenging and rewarding bodyweight exercises, primarily targeting the muscles of your back and arms.'
      },
      {
        type: 'list',
        items: [
          'Primary muscles worked: Latissimus dorsi (lats), biceps, rhomboids',
          'Secondary muscles worked: Rear deltoids, core, forearms',
          'Benefits: Builds upper body pulling strength, improves grip strength, enhances posture'
        ]
      },
      {
        type: 'paragraph',
        content: 'If you can\'t perform full pull-ups yet, start with assisted variations using resistance bands or a machine. Focus on quality over quantity, and avoid excessive swinging or kipping unless specifically training for a sport that requires it.'
      },
      {
        type: 'heading',
        content: '5. Overhead Press: Developing Shoulder Strength and Stability'
      },
      {
        type: 'paragraph',
        content: 'The overhead press, also known as the military press, is an excellent exercise for building shoulder strength, upper body stability, and core engagement.'
      },
      {
        type: 'list',
        items: [
          'Primary muscles worked: Deltoids (shoulders), triceps',
          'Secondary muscles worked: Upper chest, upper back, core',
          'Benefits: Builds shoulder strength and stability, improves posture, enhances functional pushing ability'
        ]
      },
      {
        type: 'paragraph',
        content: 'Maintain a neutral spine and avoid excessive arching in your lower back. Start with lighter weights to master the movement pattern before progressing to heavier loads.'
      },
      {
        type: 'heading',
        content: 'Programming These Exercises Effectively'
      },
      {
        type: 'paragraph',
        content: 'For optimal results, incorporate these five compound exercises into a well-structured training program:'
      },
      {
        type: 'list',
        items: [
          'Frequency: Train each movement 1-3 times per week, depending on your experience level and recovery capacity.',
          'Volume: Start with 3-4 sets of 5-12 repetitions per exercise, adjusting based on your goals.',
          'Progression: Gradually increase weight, repetitions, or sets over time to ensure continued progress.',
          'Rest: Allow 48-72 hours of recovery for muscle groups between training sessions.',
          'Balance: Ensure you\'re balancing pushing and pulling movements for optimal muscular development and posture.'
        ]
      },
      {
        type: 'quote',
        content: 'The most effective training programs focus on progressive overload with compound movements. Master these five exercises, and you\'ll build a strong foundation for any fitness goal.'
      },
      {
        type: 'paragraph',
        content: 'Remember that proper form is always more important than the amount of weight lifted. Consider working with a qualified personal trainer initially to ensure you\'re performing these movements correctly and safely.'
      },
      {
        type: 'paragraph',
        content: 'By consistently incorporating these five essential compound exercises into your training routine, you will develop total-body strength, improve your body composition, and enhance your overall functional fitness.'
      }
    ]
  },
  // Third blog post
  {
    title: "The Ultimate Guide to Post-Workout Recovery",
    slug: "the-ultimate-guide-to-post-workout-recovery",
    excerpt: "Learn the science-backed strategies to optimize your recovery between workouts, reduce soreness, and maximize your training results.",
    author: "Jaime",
    date: "March 15, 2025",
    readTime: "8 min read",
    image: "/unsplash-images/blog-3.jpg",
    category: "Wellness",
    content: [
      {
        type: 'paragraph',
        content: 'Recovery is the often-overlooked component of fitness that can make or break your results. While intense training sessions break down muscle tissue, it\'s during recovery that your body repairs, rebuilds, and grows stronger. Without adequate recovery, you risk overtraining, injury, and plateaued progress.'
      },
      {
        type: 'paragraph',
        content: 'In this comprehensive guide, we\'ll explore evidence-based strategies to optimize your post-workout recovery, reduce muscle soreness, and maximize your training adaptations.'
      },
      {
        type: 'heading',
        content: 'The Science of Muscle Recovery'
      },
      {
        type: 'paragraph',
        content: 'When you exercise, especially during resistance training, you create microscopic tears in your muscle fibers. This process, known as muscle protein breakdown, is actually the first step toward getting stronger. Your body responds to this damage by repairing the muscle tissue and building it back stronger than before—a process called muscle protein synthesis.'
      },
      {
        type: 'paragraph',
        content: 'Several factors influence how quickly and effectively your muscles recover:'
      },
      {
        type: 'list',
        items: [
          'Nutrition: Providing your body with the right nutrients at the right times',
          'Sleep: Allowing your body to enter deep recovery modes',
          'Stress management: Controlling cortisol levels that can impede recovery',
          'Active recovery: Promoting blood flow to deliver nutrients and remove waste products',
          'Hydration: Supporting all cellular processes involved in recovery'
        ]
      },
      {
        type: 'heading',
        content: 'Post-Workout Nutrition Strategies'
      },
      {
        type: 'paragraph',
        content: 'What you eat after training plays a crucial role in kickstarting the recovery process. Focus on these nutritional priorities:'
      },
      {
        type: 'list',
        items: [
          'Protein: Consume 20-40g of high-quality protein within 1-2 hours after training to support muscle repair. Options include whey protein, chicken breast, Greek yogurt, or plant-based alternatives like tofu or legumes.',
          'Carbohydrates: Replenish glycogen stores with 0.5-0.7g of carbs per pound of bodyweight, focusing on fast-digesting options like fruits, white rice, or potatoes after intense sessions.',
          'Hydration: Replace lost fluids by drinking 16-24 oz of water for every pound lost during exercise, adding electrolytes for sessions lasting over 60 minutes or in hot conditions.',
          'Anti-inflammatory foods: Incorporate foods rich in antioxidants and omega-3 fatty acids, such as berries, fatty fish, and leafy greens to help manage exercise-induced inflammation.'
        ]
      },
      {
        type: 'recipe',
        title: 'Perfect Post-Workout Recovery Smoothie',
        ingredients: [
          '1 scoop (25g) whey or plant-based protein powder',
          '1 banana (for fast-digesting carbs)',
          '1 cup frozen berries (for antioxidants)',
          '1 tbsp ground flaxseed (for omega-3s)',
          '1 cup unsweetened almond milk',
          '1/2 cup Greek yogurt (for additional protein)',
          'Ice cubes as needed',
          'Optional: 1 tsp honey for added carbohydrates'
        ],
        instructions: [
          'Add all ingredients to a blender.',
          'Blend until smooth, adding more liquid if needed.',
          'Consume within 30 minutes after your workout for optimal recovery benefits.'
        ]
      },
      {
        type: 'heading',
        content: 'The Critical Role of Sleep in Recovery'
      },
      {
        type: 'paragraph',
        content: 'Sleep is perhaps the most powerful recovery tool available, yet many athletes and fitness enthusiasts consistently shortchange their sleep. During deep sleep, your body releases growth hormone, which is essential for tissue repair and growth.'
      },
      {
        type: 'list',
        items: [
          'Aim for 7-9 hours of quality sleep per night',
          'Establish a consistent sleep schedule, even on weekends',
          'Create a sleep-conducive environment: dark, cool, and quiet',
          'Limit screen time 1-2 hours before bed to support melatonin production',
          'Consider sleep tracking to monitor your sleep quality and identify areas for improvement'
        ]
      },
      {
        type: 'quote',
        content: 'You can\'t out-train poor sleep. Many athletes focus on that extra rep or set, when they\'d be better served by an extra hour of quality sleep.'
      },
      {
        type: 'heading',
        content: 'Active Recovery Techniques'
      },
      {
        type: 'paragraph',
        content: 'While complete rest days are important, active recovery can accelerate the recovery process by increasing blood flow to damaged tissues without causing additional stress.'
      },
      {
        type: 'list',
        items: [
          'Light cardio: 20-30 minutes of low-intensity activity like walking, swimming, or cycling',
          'Mobility work: Dynamic stretching and movement patterns that address tight areas',
          'Yoga: Gentle flows that promote flexibility and stress reduction',
          'Self-myofascial release: Using foam rollers or massage balls to release tension in connective tissues',
          'Contrast therapy: Alternating between hot and cold exposure to stimulate circulation'
        ]
      },
      {
        type: 'heading',
        content: 'Managing Training Volume and Intensity'
      },
      {
        type: 'paragraph',
        content: 'A well-designed training program balances stimulus and recovery. Consider these programming strategies:'
      },
      {
        type: 'list',
        items: [
          'Periodization: Strategically vary training volume and intensity over time',
          'Deload weeks: Incorporate planned periods of reduced training load every 4-8 weeks',
          'Split routines: Organize training to allow adequate recovery between sessions targeting the same muscle groups',
          'Autoregulation: Adjust daily training based on readiness and recovery status',
          'Recovery tracking: Monitor resting heart rate, heart rate variability, or subjective markers like mood and energy levels'
        ]
      },
      {
        type: 'paragraph',
        content: 'Remember that recovery needs are highly individual and depend on factors like training experience, age, stress levels, and genetic factors. The key is developing awareness of your body\'s signals and respecting the balance between challenging yourself and allowing for adequate recovery.'
      },
      {
        type: 'paragraph',
        content: 'By implementing these recovery strategies consistently, you\'ll not only reduce your risk of injury and burnout but also maximize the returns on your training investment. In fitness, it\'s not just how hard you work—it\'s how well you recover that determines your results.'
      }
    ]
  }
];
